#!/usr/bin/env bun
/**
 * Inference script: Send buggy code + README to Qwen via OpenRouter
 * Saves the model's proposed fix to task-XXX/inference-response.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const tasksDir = join(import.meta.dir, "..", "tasks");

interface InferenceRequest {
  taskName: string;
  readme: string;
  buggyCode: string;
}

interface InferenceResponse {
  taskName: string;
  model: string;
  timestamp: string;
  inferenceDuration: number;
  attempts: number;
  prompt: string;
  response: string;
  fixedCode?: string;
  tokensUsed?: number;
}

/**
 * Read all .ts files from a directory recursively
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
 * Build prompt for the model
 */
function buildPrompt(taskName: string, readme: string, buggyCode: { [key: string]: string }): string {
  const codeBlock = Object.entries(buggyCode)
    .map(([filename, content]) => `\n## File: ${filename}\n\`\`\`typescript\n${content}\n\`\`\``)
    .join("\n");

  return `You are a Bun.js expert. Your task is to fix the buggy code in this task.

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
}

/**
 * Send request to OpenRouter API
 */
async function callOpenRouter(
  prompt: string,
  previousAttempts?: Array<{ attempt: number; error: string }>
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = Bun.env.OPENROUTER_API_KEY;
  const model = Bun.env.OPENROUTER_MODEL || "qwen/qwen3-next-80b-a3b-thinking";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set in .env");
  }

  // Build messages with previous attempt feedback
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "user",
      content: prompt,
    },
  ];

  if (previousAttempts && previousAttempts.length > 0) {
    messages.push({
      role: "assistant",
      content: previousAttempts[previousAttempts.length - 1].response || "(No response generated)",
    });

    messages.push({
      role: "user",
      content: `Your previous attempt(s) failed. Here's the feedback:\n${previousAttempts
        .map((a) => `Attempt ${a.attempt}: ${a.error}`)
        .join("\n")}\n\nPlease fix the issues and try again.`,
    });
  }

  console.log(`  📡 Calling OpenRouter (model: ${model})...`);

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
      messages,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices[0].message.content;
  const tokensUsed = data.usage?.total_tokens || 0;

  return { content, tokensUsed };
}

/**
 * Check if code has obvious syntax errors by trying to parse it
 */
function hasSyntaxErrors(code: string): boolean {
  try {
    // Simple checks for common syntax errors
    if (code.includes("SyntaxError")) return true;
    if (!code.trim()) return true;
    if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) return true;
    if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Extract code blocks from response
 */
function extractCodeFromResponse(response: string): { [filename: string]: string } {
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
  const files: { [filename: string]: string } = {};
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const block = match[1].trim();
    const fileMatch = block.match(/\/\/\s*(?:File|file):\s*src\/(.+?)\n/);
    let filename = fileMatch ? fileMatch[1] : "code.ts";
    let code = fileMatch ? block.replace(/\/\/\s*(?:File|file):\s*src\/.+?\n/, "") : block;
    files[filename] = code;
  }

  return files;
}

/**
 * Run inference on a single task with multiple attempts
 */
async function runInference(taskName: string, maxAttempts: number = 3): Promise<InferenceResponse | null> {
  const taskDir = join(tasksDir, taskName);
  const readmeFile = join(taskDir, "README.md");
  const srcDir = join(taskDir, "src");
  const inferenceFile = join(taskDir, "inference-response.json");

  // Skip if inference already exists
  if (existsSync(inferenceFile)) {
    console.log(`  ⏭️  Skipping (inference-response.json already exists)`);
    return null;
  }

  if (!existsSync(readmeFile)) {
    console.log(`  ⚠️  No README.md found`);
    return null;
  }

  if (!existsSync(srcDir)) {
    console.log(`  ⚠️  No src/ directory found`);
    return null;
  }

  console.log(`  📖 Reading README and source code...`);
  const readme = readFileSync(readmeFile, "utf-8");
  const buggyCode = readAllTypeScriptFiles(srcDir);

  const prompt = buildPrompt(taskName, readme, buggyCode);

  // Multiple attempts loop
  const attempts: Array<{ attempt: number; response: string; error: string }> = [];
  let finalResponse = "";
  let totalDuration = 0;
  let totalTokens = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  \n  🔄 Attempt ${attempt}/${maxAttempts}`);

    // Call OpenRouter and measure duration
    try {
      const startTime = performance.now();
      const { content, tokensUsed } = await callOpenRouter(
        prompt,
        attempts.length > 0 ? attempts : undefined
      );
      const duration = performance.now() - startTime;

      finalResponse = content;
      totalDuration += duration;
      totalTokens += tokensUsed;

      console.log(`  ✅ Response received (${duration.toFixed(0)}ms, ${tokensUsed} tokens)`);

      // Extract code and check for syntax errors
      const codeFiles = extractCodeFromResponse(content);
      const hasErrors = Object.values(codeFiles).some(hasSyntaxErrors);

      if (hasErrors && attempt < maxAttempts) {
        const errorMsg = "Syntax errors detected in generated code";
        console.log(`  ⚠️  ${errorMsg} - retrying...`);
        attempts.push({ attempt, response: content, error: errorMsg });
        continue;
      }

      // Success or last attempt - save and return
      const result: InferenceResponse = {
        taskName,
        model: Bun.env.OPENROUTER_MODEL || "unknown",
        timestamp: new Date().toISOString(),
        inferenceDuration: totalDuration,
        attempts: attempt,
        prompt: prompt.substring(0, 500) + "...",
        response: finalResponse,
        tokensUsed: totalTokens,
      };

      // Save response
      writeFileSync(inferenceFile, JSON.stringify(result, null, 2), "utf-8");
      console.log(`  💾 Saved to inference-response.json`);

      if (attempt > 1) {
        console.log(`  📊 Used ${attempt} attempts, ${totalTokens} total tokens`);
      }

      return result;
    } catch (error) {
      console.error(`  ❌ API call failed: ${error}`);
      if (attempt === maxAttempts) {
        return null;
      }
      attempts.push({ attempt, response: "", error: String(error) });
    }
  }

  return null;
}

/**
 * Main: Run inference on selected tasks
 */
async function main() {
  const args = process.argv.slice(2);
  let tasksToRun: string[] = [];

  if (args.length === 0) {
    // No args: run all tasks
    console.log("Usage: bun run scripts/run-inference.ts [task-name ...]");
    console.log("OR:    bun run scripts/run-inference.ts all");
    console.log("\nRunning first 3 tasks as demo...\n");
    
    const allTasks = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
    tasksToRun = allTasks.slice(0, 3);
  } else if (args[0] === "all") {
    tasksToRun = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
  } else {
    tasksToRun = args;
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`BUN BENCHMARK - INFERENCE`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Tasks to run: ${tasksToRun.length}\n`);

  let completed = 0;
  for (const taskName of tasksToRun) {
    completed++;
    console.log(`[${completed}/${tasksToRun.length}] ${taskName}`);

    const taskDir = join(tasksDir, taskName);
    if (!existsSync(taskDir)) {
      console.log(`  ❌ Task directory not found\n`);
      continue;
    }

    await runInference(taskName);
    console.log();
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`Inference complete!`);
  console.log(`Check tasks/task-XXX/inference-response.json for results`);
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
