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
  prompt: string;
  response: string;
  fixedCode?: string;
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
async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = Bun.env.OPENROUTER_API_KEY;
  const model = Bun.env.OPENROUTER_MODEL || "qwen/qwen3-next-80b-a3b-thinking";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set in .env");
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  return data.choices[0].message.content;
}

/**
 * Run inference on a single task
 */
async function runInference(taskName: string): Promise<InferenceResponse | null> {
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

  // Call OpenRouter and measure duration
  let response: string;
  let inferenceDuration: number;
  try {
    const startTime = performance.now();
    response = await callOpenRouter(prompt);
    inferenceDuration = performance.now() - startTime;
  } catch (error) {
    console.error(`  ❌ API call failed: ${error}`);
    return null;
  }

  const result: InferenceResponse = {
    taskName,
    model: Bun.env.OPENROUTER_MODEL || "unknown",
    timestamp: new Date().toISOString(),
    inferenceDuration,
    prompt: prompt.substring(0, 500) + "...", // Store truncated prompt for reference
    response,
  };

  // Save response
  const responseFile = join(taskDir, "inference-response.json");
  writeFileSync(responseFile, JSON.stringify(result, null, 2), "utf-8");
  console.log(`  ✅ Saved to inference-response.json (${inferenceDuration.toFixed(0)}ms)`);

  return result;
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
