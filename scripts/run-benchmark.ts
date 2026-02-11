#!/usr/bin/env bun
/**
 * Combined Benchmark Script
 *
 * Completes each task end-to-end before moving to the next:
 * 1. Inference (AI generates fix)
 * 2. Evaluation (run tests)
 * 3. If failed → Retry with error feedback (max 3 attempts)
 * 4. If passed → Move to next task
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const tasksDir = join(import.meta.dir, "..", "tasks");

interface BenchmarkResult {
  taskName: string;
  passed: boolean;
  attempts: number;
  totalDuration: number;
  timestamp: string;
  errors: string[];
}

interface TaskState {
  hasInference: boolean;
  hasEvaluation: boolean;
  passed: boolean;
}

/**
 * Check task completion state
 */
function getTaskState(taskName: string): TaskState {
  const taskDir = join(tasksDir, taskName);
  const inferenceFile = join(taskDir, "inference-response.json");
  const evalFile = join(taskDir, "evaluation-result.json");

  const hasInference = existsSync(inferenceFile);
  const hasEvaluation = existsSync(evalFile);

  let passed = false;
  if (hasEvaluation) {
    const evalData = JSON.parse(readFileSync(evalFile, "utf-8"));
    passed = evalData.passed === true;
  }

  return { hasInference, hasEvaluation, passed };
}

/**
 * Read all TypeScript files from a directory
 */
function readAllTypeScriptFiles(dir: string): { [filename: string]: string } {
  const files: { [filename: string]: string } = {};

  function walkDir(currentPath: string) {
    if (!existsSync(currentPath)) return;

    const entries = readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith(".ts")) {
        const relPath = fullPath.replace(dir, "").replace(/\\/g, "/");
        files[relPath] = readFileSync(fullPath, "utf-8");
      }
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Build prompt with optional error feedback
 */
function buildPrompt(
  taskName: string,
  readme: string,
  buggyCode: { [key: string]: string },
  previousErrors?: string[]
): string {
  const codeBlock = Object.entries(buggyCode)
    .map(([filename, content]) => `\n## File: ${filename}\n\`\`\`typescript\n${content}\n\`\`\``)
    .join("\n");

  let prompt = `You are a Bun.js expert. Your task is to fix the buggy code in this task.

Task: ${taskName}

## Problem Description
${readme}

## Buggy Source Code
${codeBlock}

## Instructions
1. Analyze the problem and the failing tests mentioned in the README
2. Fix the buggy code in the src/ files
3. Return ONLY the fixed code files in the same format
4. Do not return test files or solution files
5. Preserve all function signatures and exports
6. Include only the files that need to be changed

Return your fixed code in this format:
\`\`\`typescript
// File: src/filename.ts
[fixed code here]
\`\`\`

For multiple files, repeat the format above.`;

  // Add error feedback if this is a retry attempt
  if (previousErrors && previousErrors.length > 0) {
    prompt += `\n\n## ⚠️ Previous Attempt Failed\n\nYour previous fix did not pass the tests. Here is the feedback:\n\n`;
    prompt += previousErrors.map((err, i) => `### Attempt ${i + 1} Error:\n${err}`).join("\n\n");
    prompt += `\n\nPlease analyze these errors and fix the issues in your next attempt.`;
  }

  return prompt;
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  prompt: string,
  attemptNumber: number
): Promise<{ content: string; tokensUsed: number; duration: number }> {
  const apiKey = Bun.env.OPENROUTER_API_KEY;
  const model = Bun.env.OPENROUTER_MODEL || "unknown";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set in .env");
  }

  const startTime = performance.now();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/bun-bench-tasks",
      "X-Title": "Bun Benchmark",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  const duration = performance.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices[0].message.content;
  const tokensUsed = data.usage?.total_tokens || 0;

  return { content, tokensUsed, duration };
}

/**
 * Extract code blocks from AI response
 */
function extractFixedCode(response: string): { [filename: string]: string } {
  const files: { [filename: string]: string } = {};
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const block = match[1].trim();
    const fileMatch = block.match(/\/\/\s*(?:File|file):\s*src\/(.+?)\n/);
    let filename: string;
    let code: string;

    if (fileMatch) {
      filename = fileMatch[1];
      code = block.replace(/\/\/\s*(?:File|file):\s*src\/.+?\n/, "");
    } else {
      // Guess filename from content
      if (block.includes("Bun.serve") || block.includes("export default")) {
        filename = "server.ts";
      } else if (block.includes("export function") || block.includes("export const")) {
        filename = "index.ts";
      } else {
        filename = "code.ts";
      }
      code = block;
    }

    // Remove explanation comments
    code = code
      .split("\n")
      .filter(line => !line.trim().startsWith("// BUG:") && !line.trim().startsWith("// This"))
      .join("\n")
      .trim();

    if (code) {
      files[filename] = code;
    }
  }

  return files;
}

/**
 * Apply fixed code to src/ directory
 */
function applyFixes(taskDir: string, fixes: { [filename: string]: string }): void {
  const srcDir = join(taskDir, "src");

  for (const [filename, code] of Object.entries(fixes)) {
    const filePath = join(srcDir, filename);
    writeFileSync(filePath, code, "utf-8");
  }
}

/**
 * Run tests for a task
 */
async function runTests(taskDir: string): Promise<{
  passed: boolean;
  duration: number;
  error?: string;
  errorType: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
}> {
  const startTime = performance.now();

  try {
    const result = await $`cd ${taskDir} && bun test`.nothrow();
    const duration = performance.now() - startTime;
    const stderr = result.stderr.toString();
    const stdout = result.stdout.toString();
    const output = stderr + stdout;

    // Categorize error
    let errorType = "none";
    if (result.exitCode !== 0) {
      if (output.includes("timeout") || output.includes("timed out")) {
        errorType = "timeout";
      } else if (output.includes("syntaxerror") || output.includes("syntax error")) {
        errorType = "syntax_error";
      } else if (output.includes("typeerror") || output.includes("type error")) {
        errorType = "type_error";
      } else if (output.includes("fail") || output.includes("assert")) {
        errorType = "test_failure";
      } else {
        errorType = "runtime_error";
      }
    }

    // Parse test counts
    let testsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    const lines = output.split("\n");
    for (const line of lines) {
      const passMatch = line.match(/(\d+)\s+pass/);
      const failMatch = line.match(/(\d+)\s+fail/);
      if (passMatch) testsPassed += parseInt(passMatch[1]);
      if (failMatch) testsFailed += parseInt(failMatch[1]);
    }
    testsRun = testsPassed + testsFailed;

    return {
      passed: result.exitCode === 0,
      duration,
      error: result.exitCode === 0 ? undefined : output.trim().substring(0, 1000),
      errorType,
      testsRun,
      testsPassed,
      testsFailed,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      passed: false,
      duration,
      error: String(error).substring(0, 1000),
      errorType: "unknown",
    };
  }
}

/**
 * Format error message for AI feedback
 */
function formatErrorForAI(testResult: {
  error?: string;
  errorType: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
}): string {
  const lines: string[] = [];

  lines.push(`**Error Type:** ${testResult.errorType}`);
  lines.push(`**Tests:** ${testResult.testsPassed || 0}/${testResult.testsRun || 0} passed`);
  lines.push(`**Test Failures:** ${testResult.testsFailed || 0} tests failed`);

  if (testResult.error) {
    // Extract all "Expected / Received" lines
    const errorLines = testResult.error.split("\n")
      .filter(line => {
        const lower = line.toLowerCase();
        // Keep lines that show actual failures
        return lower.includes("expected:") && lower.includes("received:");
      });

    if (errorLines.length > 0) {
      lines.push(`**Error Details:**`);
      lines.push("```");
      // Show ALL failures (compact format)
      lines.push(...errorLines);
      lines.push("```");
    }
  }

  return lines.join("\n");
}

/**
 * Backup and restore source code
 */
function backupSource(taskDir: string): string {
  const srcDir = join(taskDir, "src");
  const backupDir = join(taskDir, ".src-backup");

  if (!existsSync(srcDir)) return backupDir;

  rmSync(backupDir, { recursive: true, force: true });

  readdirSync(srcDir).forEach(file => {
    const srcPath = join(srcDir, file);
    const destPath = join(backupDir, file);
    mkdirSync(join(destPath, ".."), { recursive: true });
    copyFileSync(srcPath, destPath);
  });

  return backupDir;
}

function restoreSource(taskDir: string, backupDir: string): void {
  const srcDir = join(taskDir, "src");

  if (!existsSync(backupDir)) return;

  rmSync(srcDir, { recursive: true, force: true });
  mkdirSync(srcDir, { recursive: true });

  readdirSync(backupDir).forEach(file => {
    const src = join(backupDir, file);
    const dest = join(srcDir, file);
    copyFileSync(src, dest);
  });

  rmSync(backupDir, { recursive: true, force: true });
}

/**
 * Process a single task with retry logic
 */
async function processTask(taskName: string, maxAttempts: number = 3): Promise<BenchmarkResult | null> {
  const taskDir = join(tasksDir, taskName);
  const readmeFile = join(taskDir, "README.md");
  const srcDir = join(taskDir, "src");
  const evalFile = join(taskDir, "evaluation-result.json");
  const inferenceFile = join(taskDir, "inference-response.json");

  console.log(`\n[${taskName}]`);

  // Skip if already passed
  const state = getTaskState(taskName);
  if (state.passed) {
    console.log(`  ⏭️  Already passed, skipping`);
    return null;
  }

  // Read task files
  if (!existsSync(readmeFile) || !existsSync(srcDir)) {
    console.log(`  ⚠️  Missing task files`);
    return null;
  }

  const readme = readFileSync(readmeFile, "utf-8");
  const buggyCode = readAllTypeScriptFiles(srcDir);

  // Retry loop with test feedback
  const errors: string[] = [];
  let finalResult: BenchmarkResult | null = null;
  const startTime = performance.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  🔄 Attempt ${attempt}/${maxAttempts}`);

    // Build prompt (with error feedback if retry)
    const prompt = buildPrompt(taskName, readme, buggyCode, errors.length > 0 ? errors : undefined);

    // Show prompt preview in console
    console.log(`  📝 Sending prompt to AI (${prompt.length} chars, ${errors.length} previous errors)`);

    // Show full prompt if --show-prompt flag is used
    if ((global as any).showPrompt) {
      console.log(`\n  ╔════════════════════════════════════════════════════════════╗`);
      console.log(`  ║ FULL PROMPT TO AI:                                            ║`);
      console.log(`  ╚════════════════════════════════════════════════════════════╝`);
      // Show first 2000 chars of prompt
      const preview = prompt.substring(0, 2000);
      preview.split('\n').forEach(line => {
        const truncated = line.length > 70 ? line.substring(0, 67) + "..." : line;
        console.log(`  ║ ${truncated.padEnd(70)} ║`);
      });
      if (prompt.length > 2000) {
        console.log(`  ║ ${"...(prompt truncated, ".repeat(40)}...".padEnd(70)} ║`);
        console.log(`  ║ ${`Total: ${prompt.length} characters`.padEnd(70)} ║`);
      }
      console.log(`  ╚════════════════════════════════════════════════════════════╝\n`);
    }

    // Call AI
    try {
      const { content, tokensUsed, duration } = await callOpenRouter(prompt, attempt);
      console.log(`  📡 AI Response (${duration.toFixed(0)}ms, ${tokensUsed} tokens)`);

      // Show error feedback preview
      if (errors.length > 0) {
        console.log(`  📋 Error feedback included (${errors.length} errors)`);
        const lastError = errors[errors.length - 1];
        const preview = lastError.split('\n').slice(0, 3).join('\n');
        console.log(`  ┌────────────────────────────────────────┐`);
        console.log(`  │ Last Error (preview):                  │`);
        console.log(`  └────────────────────────────────────────┘`);
        preview.split('\n').forEach(line => console.log(`  │ ${line.substring(0, 40)}${line.length > 40 ? '...' : ''} `));
        console.log(`  └────────────────────────────────────────┘`);
      }

      // Debug: Save each attempt's response for inspection
      const attemptFile = join(taskDir, `attempt-${attempt}.json`);
      writeFileSync(attemptFile, JSON.stringify({
        attempt,
        timestamp: new Date().toISOString(),
        prompt: prompt,
        response: content,
        tokensUsed,
      }, null, 2), "utf-8");

      // Extract code
      const fixes = extractFixedCode(content);
      if (Object.keys(fixes).length === 0) {
        console.log(`  ⚠️  No code generated`);
        console.log(`  💾 Check attempt-${attempt}.json to see AI's response`);
        errors.push(formatErrorForAI({
          errorType: "no_code_generated",
          error: "AI did not generate any code blocks",
        }));
        continue;
      }

      console.log(`  📝 Found ${Object.keys(fixes).length} file(s) to fix`);

      // Apply fixes
      const backupDir = backupSource(taskDir);
      applyFixes(taskDir, fixes);

      // Run tests
      console.log(`  🧪 Running tests...`);
      const testResult = await runTests(taskDir);

      // Restore source
      restoreSource(taskDir, backupDir);

      if (testResult.passed) {
        // Success!
        const totalDuration = performance.now() - startTime;
        console.log(`  ✅ PASSED (${testResult.duration.toFixed(0)}ms) [${testResult.testsPassed}/${testResult.testsRun} tests]`);

        finalResult = {
          taskName,
          passed: true,
          attempts: attempt,
          totalDuration,
          timestamp: new Date().toISOString(),
          errors: [],
        };

        // Save evaluation result
        const evalResult = {
          taskName,
          passed: true,
          duration: testResult.duration,
          timestamp: new Date().toISOString(),
          errorType: "none",
          testsRun: testResult.testsRun,
          testsPassed: testResult.testsPassed,
          testsFailed: testResult.testsFailed,
        };
        writeFileSync(evalFile, JSON.stringify(evalResult, null, 2), "utf-8");

        // Save inference result
        const inferResult = {
          taskName,
          model: Bun.env.OPENROUTER_MODEL || "unknown",
          timestamp: new Date().toISOString(),
          inferenceDuration: duration,
          attempts: attempt,
          prompt: prompt.substring(0, 500) + "...",
          response: content,
          tokensUsed,
        };
        writeFileSync(inferenceFile, JSON.stringify(inferResult, null, 2), "utf-8");

        return finalResult;
      } else {
        // Failed - add error and retry
        console.log(`  ❌ FAILED - ${testResult.errorType} [${testResult.testsPassed || 0}/${testResult.testsRun || 0} tests]`);
        if (testResult.error && testResult.error.length < 200) {
          console.log(`     ${testResult.error.split("\n")[0]}`);
        }

        const errorMsg = formatErrorForAI(testResult);
        errors.push(errorMsg);

        // Save failed inference for transparency
        const inferResult = {
          taskName,
          model: Bun.env.OPENROUTER_MODEL || "unknown",
          timestamp: new Date().toISOString(),
          inferenceDuration: duration,
          attempts: attempt,
          prompt: prompt.substring(0, 500) + "...",
          response: content,
          tokensUsed,
        };
        writeFileSync(inferenceFile, JSON.stringify(inferResult, null, 2), "utf-8");
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
      errors.push(`**API Error:** ${error}`);
    }
  }

  // All attempts failed
  const totalDuration = performance.now() - startTime;
  console.log(`  ⏭️  Skipped after ${maxAttempts} failed attempts`);

  finalResult = {
    taskName,
    passed: false,
    attempts: maxAttempts,
    totalDuration,
    timestamp: new Date().toISOString(),
    errors,
  };

  return finalResult;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  let tasksToRun: string[] = [];
  const verbose = args.includes("--verbose");
  const showPrompt = args.includes("--show-prompt");

  // Filter out flags
  args = args.filter(a => !a.startsWith("--"));

  if (args.length === 0 || args[0] === "all") {
    tasksToRun = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
  } else {
    tasksToRun = args;
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`BUN BENCHMARK - TASK-BY-TASK WORKFLOW`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Model: ${Bun.env.OPENROUTER_MODEL || "unknown"}`);
  console.log(`Tasks: ${tasksToRun.length}`);
  console.log(`Max attempts per task: 3`);
  if (verbose) console.log(`Verbose: ON`);
  if (showPrompt) console.log(`Show prompts: ON`);
  console.log(`${"=".repeat(60)}`);

  // Export verbose flag for processTask
  (global as any).verbose = verbose;
  (global as any).showPrompt = showPrompt;

  const results: BenchmarkResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < tasksToRun.length; i++) {
    const taskName = tasksToRun[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Task ${i + 1}/${tasksToRun.length}: ${taskName}`);
    console.log(`${"=".repeat(60)}`);

    const result = await processTask(taskName);

    if (result) {
      results.push(result);
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    } else {
      skipped++;
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`BENCHMARK SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Passed:   ${passed} ✅`);
  console.log(`Failed:   ${failed} ❌`);
  console.log(`Skipped:  ${skipped} ⏭️`);
  if (passed + failed > 0) {
    console.log(`Success:  ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  }
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
