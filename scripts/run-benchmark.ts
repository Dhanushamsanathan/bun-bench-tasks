#!/usr/bin/env bun
/**
 * Bun Benchmark Runner
 *
 * Runs AI-powered bug fixing on Bun.js tasks:
 * 1. Inference - AI generates fix from buggy code + README
 * 2. Evaluation - Run tests to verify fix
 * 3. Retry - Up to 3 attempts with error feedback
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync, copyFileSync, appendFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

// ============================================================================
// Configuration
// ============================================================================

const tasksDir = join(import.meta.dir, "..", "tasks");
const rootDir = join(import.meta.dir, "..");
const logsDir = join(rootDir, "benchmark-logs");

const MAX_ATTEMPTS = 3;
const MAX_TOKENS = 6000;

// Ensure logs directory exists
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Log file naming
const modelName = Bun.env.OPENROUTER_MODEL || "unknown";
const safeModelName = modelName.replace(/\//g, "-").replace(/\s+/g, "-").replace(/[^\w-]/g, "");
const customLogFile = Bun.env.BENCHMARK_LOG_FILE;
const logFileName = customLogFile ? `${customLogFile}.log` : `${safeModelName} benchmark.log`;
let logFilePath = join(logsDir, logFileName);

// ============================================================================
// Interfaces
// ============================================================================

interface BenchmarkResult {
  taskName: string;
  passed: boolean;
  attempts: number;
  totalDuration: number;
  timestamp: string;
  errors: string[];
}

interface TestResult {
  passed: boolean;
  duration: number;
  error?: string;
  errorType: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
}

interface TaskState {
  hasInference: boolean;
  hasEvaluation: boolean;
  passed: boolean;
}

interface FileMap { [filename: string]: string; }

interface InferenceResult {
  content: string;
  tokensUsed: number;
  duration: number;
}

// ============================================================================
// Logging
// ============================================================================

function log(message: string): void {
  console.log(message);
  appendFileSync(logFilePath, message + "\n", "utf-8");
}

function logSeparator(char = "=", length = 60): void {
  const line = char.repeat(length);
  console.log(line);
  appendFileSync(logFilePath, line + "\n", "utf-8");
}

// ============================================================================
// File Operations
// ============================================================================

function readAllTypeScriptFiles(dir: string): FileMap {
  const files: FileMap = {};

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

function backupSource(taskDir: string): string {
  const srcDir = join(taskDir, "src");
  const backupDir = join(taskDir, ".src-backup");

  if (!existsSync(srcDir)) return backupDir;

  rmSync(backupDir, { recursive: true, force: true });

  for (const file of readdirSync(srcDir)) {
    const srcPath = join(srcDir, file);
    const destPath = join(backupDir, file);
    mkdirSync(join(destPath, ".."), { recursive: true });
    copyFileSync(srcPath, destPath);
  }

  return backupDir;
}

function restoreSource(taskDir: string, backupDir: string): void {
  const srcDir = join(taskDir, "src");

  if (!existsSync(backupDir)) return;

  rmSync(srcDir, { recursive: true, force: true });
  mkdirSync(srcDir, { recursive: true });

  for (const file of readdirSync(backupDir)) {
    copyFileSync(join(backupDir, file), join(srcDir, file));
  }

  rmSync(backupDir, { recursive: true, force: true });
}

function applyFixes(taskDir: string, fixes: FileMap): void {
  const srcDir = join(taskDir, "src");

  for (const [filename, code] of Object.entries(fixes)) {
    writeFileSync(join(srcDir, filename), code, "utf-8");
  }
}

// ============================================================================
// Task State
// ============================================================================

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

// ============================================================================
// Prompt Building
// ============================================================================

function buildPrompt(taskName: string, readme: string, buggyCode: FileMap, previousErrors?: string[]): string {
  const codeBlock = Object.entries(buggyCode)
    .map(([filename, content]) => `\n## File: ${filename}\n\`\`\`typescript\n${content}\n\`\`\``)
    .join("\n");

  let prompt = `You are an expert Bun.js developer. Your task is to fix the buggy code below.

Task: ${taskName}

## Problem Description
${readme}

## Instructions
1. Read the problem carefully and understand what's broken
2. Fix ONLY the bugs - do not refactor working code
3. Think through the test cases mentally before writing code
4. Return fixed code in this format: \`\`\`typescript
// File: src/filename.ts
[fixed code here]
\`\`\`

## Buggy Source Code
${codeBlock}`;

  if (previousErrors && previousErrors.length > 0) {
    prompt += `\n\n## Previous Attempts Failed

Your previous fix did not pass. Here is the specific feedback:

${previousErrors.map((err, i) => `### Attempt ${i + 1}:\n${err}`).join("\n\n")}

Please analyze these errors and fix the specific issues mentioned above.`;
  }

  return prompt;
}

// ============================================================================
// Temperature Scaling
// ============================================================================

function getTemperature(taskName: string): number {
  if (!taskName) return 0.3;

  const taskNum = parseInt(taskName.split("-")[1]?.padStart(3, "0") || "0");

  // Easy: 001-010, 041-045
  if ((taskNum >= 1 && taskNum <= 10) || (taskNum >= 41 && taskNum <= 45)) return 0.1;
  // Medium: 011-030, 051-056, 068-072
  if ((taskNum >= 11 && taskNum <= 30) || (taskNum >= 51 && taskNum <= 56) || (taskNum >= 68 && taskNum <= 72)) return 0.3;
  // Hard: 031-040, 046-050, 057-067, 073-080
  return 0.5;
}

// ============================================================================
// AI API
// ============================================================================

async function callOpenRouter(prompt: string, taskName: string): Promise<InferenceResult> {
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
        { role: "system", content: "You are a senior Bun.js developer. Write concise, correct code. Focus on fixing bugs rather than refactoring." },
        { role: "user", content: prompt },
      ],
      temperature: getTemperature(taskName),
      max_tokens: MAX_TOKENS,
    }),
  });

  const duration = performance.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;

  // Extract content from response
  let content = "";
  if (data.choices?.[0]?.message?.content) {
    content = data.choices[0].message.content;
  } else if (data.content) {
    content = data.content;
  } else if (data.message?.content) {
    content = data.message.content;
  }

  const tokensUsed = data.usage?.total_tokens || 0;

  return { content, tokensUsed, duration };
}

// ============================================================================
// Code Extraction
// ============================================================================

function extractFixedCode(response: string): FileMap {
  const files: FileMap = {};

  if (!response || response.trim().length === 0) {
    return files;
  }

  const patterns = [
    /```typescript\n([\s\S]*?)```/g,
    /```ts\n([\s\S]*?)```/g,
    /```javascript\n([\s\S]*?)```/g,
    /```js\n([\s\S]*?)```/g,
    /```\n([\s\S]*?)```/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(response)) !== null) {
      let block = match[1].trim();

      // Extract filename from // File: src/filename.ts
      const fileMatch = block.match(/\/\/\s*(?:File|file):\s*src\/(.+?)\n/);
      let filename: string;
      let code: string;

      if (fileMatch) {
        filename = fileMatch[1];
        code = block.replace(/\/\/\s*(?:File|file):\s*src\/.+?\n/, "");
      } else {
        // Guess filename from content
        if (block.includes("Bun.serve") || (block.includes("export default") && block.includes("fetch"))) {
          filename = "server.ts";
        } else if (block.includes("export function") || block.includes("export const") || block.includes("interface ")) {
          filename = "index.ts";
        } else if (block.includes("import { SQL }") || block.includes("import { sql }")) {
          filename = "types.ts";
        } else if (block.includes("describe(") || block.includes("test(")) {
          filename = "test.ts";
        } else {
          filename = "code.ts";
        }
        code = block;
      }

      // Trim at explanation sections
      const markers = ["\n##", "\n**", "\n---", "\nFixes applied:", "\nFixes Summary:", "\n1.", "\n2.", "\n3.", "\n4.", "\n5.", "\n6.", "\n7."];
      for (const marker of markers) {
        const idx = code.indexOf(marker);
        if (idx > 0) {
          code = code.substring(0, idx);
          break;
        }
      }

      // Clean non-code lines
      code = code
        .split("\n")
        .filter(line => {
          const t = line.trim();
          if (t.startsWith("// BUG:") || t.startsWith("// This")) return false;
          if (t.match(/^\d+\./)) return false;
          if (t.match(/^\*\*.*:\*\*$/)) return false;
          if (t.startsWith("---")) return false;
          return true;
        })
        .join("\n")
        .trim();

      // Validate as code
      const hasCode = /import|export|function|const|class|var|let|interface|type|enum/.test(code);

      if (code.length > 10 && hasCode) {
        files[filename] = code;
      }
    }
  }

  return files;
}

// ============================================================================
// Testing
// ============================================================================

async function runTests(taskDir: string): Promise<TestResult> {
  const startTime = performance.now();

  try {
    const result = await $`cd ${taskDir} && bun test`.nothrow();
    const duration = performance.now() - startTime;
    const output = result.stderr.toString() + result.stdout.toString();

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
    let testsPassed = 0;
    let testsFailed = 0;
    for (const line of output.split("\n")) {
      const passMatch = line.match(/(\d+)\s+pass/);
      const failMatch = line.match(/(\d+)\s+fail/);
      if (passMatch) testsPassed += parseInt(passMatch[1]);
      if (failMatch) testsFailed += parseInt(failMatch[1]);
    }

    return {
      passed: result.exitCode === 0,
      duration,
      error: result.exitCode === 0 ? undefined : output.trim().substring(0, 1000),
      errorType,
      testsRun: testsPassed + testsFailed,
      testsPassed,
      testsFailed,
    };
  } catch (error) {
    return {
      passed: false,
      duration: performance.now() - startTime,
      error: String(error).substring(0, 1000),
      errorType: "unknown",
    };
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

function formatErrorForAI(testResult: TestResult): string {
  const lines: string[] = [];

  if (testResult.errorType === "syntax_error" || testResult.errorType === "type_error") {
    lines.push(`${testResult.errorType.toUpperCase()}: Fix this first.`);
    if (testResult.error) {
      lines.push(...testResult.error.split("\n").slice(0, 3));
    }
  } else if (testResult.errorType === "test_failure") {
    lines.push(`Tests: ${testResult.testsPassed || 0}/${testResult.testsRun || 0} passed`);
    const assertions = testResult.error?.match(/expect\((.*?)\)\.\s*(.*?)Received/g);
    if (assertions) {
      lines.push("Failed assertions:", ...assertions.slice(0, 3));
    }
  } else {
    lines.push(`Error: ${testResult.errorType}`);
    lines.push(`Tests: ${testResult.testsPassed || 0}/${testResult.testsRun || 0} passed`);
  }

  return lines.join("\n");
}

// ============================================================================
// Task Processing
// ============================================================================

async function processTask(taskName: string): Promise<BenchmarkResult | null> {
  const taskDir = join(tasksDir, taskName);
  const readmeFile = join(taskDir, "README.md");
  const srcDir = join(taskDir, "src");
  const evalFile = join(taskDir, "evaluation-result.json");
  const inferenceFile = join(taskDir, "inference-response.json");

  log(`\n[${taskName}]`);

  // Skip if already passed
  const state = getTaskState(taskName);
  if (state.passed) {
    log(`  Skipped (already passed)`);
    return null;
  }

  if (!existsSync(readmeFile) || !existsSync(srcDir)) {
    log(`  Missing task files`);
    return null;
  }

  const readme = readFileSync(readmeFile, "utf-8");
  const buggyCode = readAllTypeScriptFiles(srcDir);
  const errors: string[] = [];
  const startTime = performance.now();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    log(`  Attempt ${attempt}/${MAX_ATTEMPTS}`);

    const prompt = buildPrompt(taskName, readme, buggyCode, errors.length > 0 ? errors : undefined);

    try {
      const { content, tokensUsed, duration } = await callOpenRouter(prompt, taskName);
      log(`  AI response: ${tokensUsed} tokens, ${duration.toFixed(0)}ms`);

      // Save attempt
      writeFileSync(join(taskDir, `attempt-${attempt}.json`), JSON.stringify({
        attempt,
        timestamp: new Date().toISOString(),
        prompt,
        response: content,
        tokensUsed,
      }, null, 2), "utf-8");

      // Extract code
      const fixes = extractFixedCode(content);
      if (Object.keys(fixes).length === 0) {
        log(`  Code extraction failed`);
        errors.push(`Could not extract code from AI response`);
        continue;
      }

      log(`  Fixed ${Object.keys(fixes).length} file(s)`);

      // Apply and test
      const backupDir = backupSource(taskDir);
      applyFixes(taskDir, fixes);
      const testResult = await runTests(taskDir);

      if (testResult.passed) {
        const totalDuration = performance.now() - startTime;
        log(`  PASSED (${testResult.duration.toFixed(0)}ms) [${testResult.testsPassed}/${testResult.testsRun} tests]`);

        // Save results
        writeFileSync(evalFile, JSON.stringify({
          taskName,
          passed: true,
          duration: testResult.duration,
          timestamp: new Date().toISOString(),
          errorType: "none",
          testsRun: testResult.testsRun,
          testsPassed: testResult.testsPassed,
          testsFailed: testResult.testsFailed,
        }, null, 2), "utf-8");

        writeFileSync(inferenceFile, JSON.stringify({
          taskName,
          model: Bun.env.OPENROUTER_MODEL || "unknown",
          timestamp: new Date().toISOString(),
          inferenceDuration: duration,
          attempts: attempt,
          prompt,
          response: content,
          tokensUsed,
        }, null, 2), "utf-8");

        restoreSource(taskDir, backupDir);

        return { taskName, passed: true, attempts: attempt, totalDuration, timestamp: new Date().toISOString(), errors: [] };
      } else {
        restoreSource(taskDir, backupDir);
        log(`  FAILED - ${testResult.errorType} [${testResult.testsPassed || 0}/${testResult.testsRun || 0}]`);

        const errorMsg = formatErrorForAI(testResult);
        errors.push(errorMsg);

        // Save failed inference
        writeFileSync(inferenceFile, JSON.stringify({
          taskName,
          model: Bun.env.OPENROUTER_MODEL || "unknown",
          timestamp: new Date().toISOString(),
          inferenceDuration: duration,
          attempts: attempt,
          prompt,
          response: content,
          tokensUsed,
        }, null, 2), "utf-8");
      }
    } catch (error) {
      log(`  Error: ${error}`);
      const backupDir = join(taskDir, ".src-backup");
      if (existsSync(backupDir)) restoreSource(taskDir, backupDir);
      errors.push(`API Error: ${error}`);
    }
  }

  // All attempts failed
  const totalDuration = performance.now() - startTime;
  log(`  Failed after ${MAX_ATTEMPTS} attempts`);

  const backupDir = join(taskDir, ".src-backup");
  if (existsSync(backupDir)) restoreSource(taskDir, backupDir);

  return { taskName, passed: false, attempts: MAX_ATTEMPTS, totalDuration, timestamp: new Date().toISOString(), errors };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const showPrompt = args.includes("--show-prompt");
  const appendMode = args.includes("--append");

  const taskArgs = args.filter(a => !a.startsWith("--"));
  const tasksToRun = taskArgs.length === 0 || taskArgs[0] === "all"
    ? readdirSync(tasksDir).filter(d => d.startsWith("task-")).sort()
    : taskArgs;

  // Setup log file
  if (existsSync(logFilePath) && !appendMode) {
    let counter = 1;
    let numberedLogPath: string;
    do {
      numberedLogPath = join(logsDir, `${safeModelName}-${counter}.log`);
      counter++;
    } while (existsSync(numberedLogPath));
    logFilePath = numberedLogPath;
  }

  console.log(`Log: ${logFilePath}`);

  logSeparator("=", 60);
  log(`BUN BENCHMARK`);
  logSeparator("=", 60);
  log(`Model: ${modelName}`);
  log(`Tasks: ${tasksToRun.length}`);
  log(`Max attempts: ${MAX_ATTEMPTS}`);
  logSeparator("=", 60);

  const results: BenchmarkResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < tasksToRun.length; i++) {
    log(`\n--- Task ${i + 1}/${tasksToRun.length}: ${tasksToRun[i]} ---`);
    const result = await processTask(tasksToRun[i]);

    if (result) {
      results.push(result);
      result.passed ? passed++ : failed++;
    } else {
      skipped++;
    }
  }

  // Summary
  log(`\n${"=".repeat(60)}`);
  log(`SUMMARY`);
  log(`${"=".repeat(60)}`);
  log(`Passed:  ${passed}`);
  log(`Failed:  ${failed}`);
  log(`Skipped: ${skipped}`);
  if (passed + failed > 0) {
    log(`Success: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);
