#!/usr/bin/env bun
/**
 * Evaluation script: Apply model's fix from inference-response.json
 * Run bun test and record pass/fail
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const tasksDir = join(import.meta.dir, "..", "tasks");

interface EvaluationResult {
  taskName: string;
  passed: boolean;
  duration: number;
  timestamp: string;
  error?: string;
}

/**
 * Extract fixed code blocks from model response
 * Handles multiple formats:
 * 1. With explicit file header: ```typescript\n// File: src/filename.ts\n[code]\n```
 * 2. Without header: ```typescript\n[code]\n``` (guess filename from content)
 */
function extractFixedCode(response: string): { [filename: string]: string } {
  const files: { [filename: string]: string } = {};
  
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
  let match;
  let blockNum = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const block = match[1].trim();
    
    // Try to extract filename from explicit comment
    const fileMatch = block.match(/\/\/\s*(?:File|file):\s*src\/(.+?)\n/);
    let filename: string;
    let code: string;
    
    if (fileMatch) {
      // Has explicit file header
      filename = fileMatch[1];
      code = block.replace(/\/\/\s*(?:File|file):\s*src\/.+?\n/, "");
    } else {
      // No explicit header - guess from content
      blockNum++;
      
      // Heuristics to guess filename
      if (block.includes("Bun.serve") || block.includes("fetch(req)") || block.includes("export default")) {
        filename = "server.ts";
      } else if (block.includes("describe(") || block.includes("test(") || block.includes("expect(")) {
        filename = "test.ts";
      } else if (block.includes("class ") || block.includes("interface ")) {
        filename = "types.ts";
      } else if (block.includes("export function") || block.includes("export const")) {
        filename = "index.ts";
      } else {
        // Default fallback
        filename = `code${blockNum}.ts`;
      }
      
      code = block;
    }
    
    // Remove BUG comments and explanations that start with //
    code = code
      .split('\n')
      .filter(line => !line.trim().startsWith('// BUG:') && !line.trim().startsWith('// This'))
      .join('\n')
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

  if (!existsSync(srcDir)) {
    throw new Error(`src/ directory not found in ${taskDir}`);
  }

  for (const [filename, code] of Object.entries(fixes)) {
    const filePath = join(srcDir, filename);
    writeFileSync(filePath, code, "utf-8");
    console.log(`    Fixed: ${filename}`);
  }
}

/**
 * Run tests for a task
 */
async function runTests(taskDir: string): Promise<{ passed: boolean; duration: number; error?: string }> {
  const startTime = performance.now();

  try {
    const result = await $`cd ${taskDir} && bun test`.nothrow();
    const duration = performance.now() - startTime;

    return {
      passed: result.exitCode === 0,
      duration,
      error: result.exitCode === 0 ? undefined : result.stderr.toString().trim(),
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      passed: false,
      duration,
      error: String(error),
    };
  }
}

/**
 * Evaluate a single task
 */
async function evaluateTask(taskName: string): Promise<EvaluationResult | null> {
  const taskDir = join(tasksDir, taskName);
  const inferenceFile = join(taskDir, "inference-response.json");
  const evalResultFile = join(taskDir, "evaluation-result.json");
  const srcBakDir = join(taskDir, "src.eval-bak");

  // Skip if evaluation already exists
  if (existsSync(evalResultFile)) {
    console.log(`  ⏭️  Skipping (evaluation-result.json already exists)`);
    return null;
  }

  if (!existsSync(inferenceFile)) {
    console.log(`  ⚠️  No inference-response.json found`);
    return null;
  }

  try {
    // Read inference response
    const inferenceData = JSON.parse(readFileSync(inferenceFile, "utf-8"));
    const { response } = inferenceData;

    // Extract fixed code
    console.log(`  🔍 Extracting fixed code...`);
    const fixes = extractFixedCode(response);

    if (Object.keys(fixes).length === 0) {
      console.log(`  ⚠️  No fixed code blocks found in response`);
      return null;
    }

    console.log(`  📝 Found ${Object.keys(fixes).length} file(s) to fix`);

    // Backup original src
    const srcDir = join(taskDir, "src");
    if (existsSync(srcDir)) {
      if (existsSync(srcBakDir)) {
        rmSync(srcBakDir, { recursive: true, force: true });
      }
      // Use Node.js rename instead of shell mv
      rmSync(srcBakDir, { recursive: true, force: true });
      readdirSync(srcDir).forEach(file => {
        const srcPath = join(srcDir, file);
        const destPath = join(srcBakDir, file);
        mkdirSync(join(destPath, ".."), { recursive: true });
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
        }
      });
    }

    // Create fresh src dir
    mkdirSync(srcDir, { recursive: true });

    // Copy original files back first (to preserve non-modified files)
    if (existsSync(srcBakDir)) {
      const origFiles = readdirSync(srcBakDir);
      for (const file of origFiles) {
        const src = join(srcBakDir, file);
        const dest = join(srcDir, file);
        copyFileSync(src, dest);
      }
    }

    // Apply fixes
    console.log(`  ✏️  Applying fixes...`);
    applyFixes(taskDir, fixes);

    // Run tests
    console.log(`  🧪 Running tests...`);
    const testResult = await runTests(taskDir);

    const result = {
      taskName,
      passed: testResult.passed,
      duration: testResult.duration,
      timestamp: new Date().toISOString(),
      error: testResult.error,
    };

    // Save evaluation result to file
    const evalResultFile = join(taskDir, "evaluation-result.json");
    writeFileSync(evalResultFile, JSON.stringify(result, null, 2), "utf-8");

    // Restore original src
    if (existsSync(srcBakDir)) {
      rmSync(srcDir, { recursive: true, force: true });
      // Copy back from backup
      readdirSync(srcBakDir).forEach(file => {
        const srcPath = join(srcBakDir, file);
        const destPath = join(srcDir, file);
        mkdirSync(join(destPath, ".."), { recursive: true });
        copyFileSync(srcPath, destPath);
      });
      rmSync(srcBakDir, { recursive: true, force: true });
    }

    return result;
  } catch (error) {
    // Clean up on error
    if (existsSync(srcBakDir)) {
      const srcDir = join(taskDir, "src");
      rmSync(srcDir, { recursive: true, force: true });
      // Copy back from backup
      readdirSync(srcBakDir).forEach(file => {
        const srcPath = join(srcBakDir, file);
        const destPath = join(srcDir, file);
        mkdirSync(join(destPath, ".."), { recursive: true });
        copyFileSync(srcPath, destPath);
      });
      rmSync(srcBakDir, { recursive: true, force: true });
    }

    console.log(`  ❌ Error: ${error}`);
    return null;
  }
}

/**
 * Main: Evaluate selected tasks
 */
async function main() {
  const args = process.argv.slice(2);
  let tasksToEval: string[] = [];

  if (args.length === 0) {
    console.log("Usage: bun run scripts/run-evaluation.ts [task-name ...]");
    console.log("OR:    bun run scripts/run-evaluation.ts all");
    console.log("\nRunning first 3 tasks as demo...\n");

    const allTasks = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
    tasksToEval = allTasks.slice(0, 3);
  } else if (args[0] === "all") {
    tasksToEval = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
  } else {
    tasksToEval = args;
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`BUN BENCHMARK - EVALUATION`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Tasks to evaluate: ${tasksToEval.length}\n`);

  let completed = 0;
  let passed = 0;
  let failed = 0;

  for (const taskName of tasksToEval) {
    completed++;
    console.log(`[${completed}/${tasksToEval.length}] ${taskName}`);

    const taskDir = join(tasksDir, taskName);
    if (!existsSync(taskDir)) {
      console.log(`  ❌ Task directory not found\n`);
      continue;
    }

    const result = await evaluateTask(taskName);
    if (result) {
      if (result.passed) {
        passed++;
        console.log(`  ✅ PASSED (${result.duration.toFixed(0)}ms)\n`);
      } else {
        failed++;
        console.log(`  ❌ FAILED (${result.duration.toFixed(0)}ms)\n`);
        if (result.error) {
          const errorLines = result.error.split('\n').slice(0, 3);
          errorLines.forEach(line => console.log(`     ${line}`));
          console.log();
        }
      }
    } else {
      console.log();
    }
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`EVALUATION SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Passed:  ${passed} ✅`);
  console.log(`Failed:  ${failed} ❌`);
  if (passed + failed > 0) {
    console.log(`Success: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  }
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
