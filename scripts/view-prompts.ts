#!/usr/bin/env bun
/**
 * View Prompts Script
 *
 * Shows exactly what messages will be sent to the AI for each attempt
 * without actually calling the API
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const tasksDir = join(import.meta.dir, "..", "tasks");

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
 * Format error message for AI feedback
 */
function formatErrorForAI(errorType: string, errorMessage: string): string {
  const lines: string[] = [];

  lines.push(`**Error Type:** ${errorType}`);
  lines.push(`**Tests:** Failed`);

  if (errorMessage) {
    lines.push(`**Error Details:**`);
    lines.push("```");
    lines.push(errorMessage.substring(0, 500));
    lines.push("```");
  }

  return lines.join("\n");
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: bun run scripts/view-prompts.ts <task-name>");
    console.log("Example: bun run scripts/view-prompts.ts task-009-sqlite-bigint");
    process.exit(1);
  }

  const taskName = args[0];
  const taskDir = join(tasksDir, taskName);
  const readmeFile = join(taskDir, "README.md");
  const srcDir = join(taskDir, "src");

  if (!existsSync(readmeFile) || !existsSync(srcDir)) {
    console.error(`❌ Task files not found for: ${taskName}`);
    process.exit(1);
  }

  console.log(`${"=".repeat(80)}`);
  console.log(`PROMPTS FOR: ${taskName}`);
  console.log(`${"=".repeat(80)}\n`);

  // Read task files
  const readme = readFileSync(readmeFile, "utf-8");
  const buggyCode = readAllTypeScriptFiles(srcDir);

  // Attempt 1: No errors
  console.log(`${"=".repeat(80)}`);
  console.log(`ATTEMPT 1/3 - Initial Request`);
  console.log(`${"=".repeat(80)}\n`);
  const prompt1 = buildPrompt(taskName, readme, buggyCode);
  console.log(prompt1);
  console.log(`\n${"=".repeat(80)}`);
  console.log(`PROMPT LENGTH: ${prompt1.length} characters`);
  console.log(`${"=".repeat(80)}\n`);

  // Attempt 2: With first error
  console.log(`\n${"=".repeat(80)}`);
  console.log(`ATTEMPT 2/3 - With First Error Feedback`);
  console.log(`${"=".repeat(80)}\n`);
  const mockError1 = formatErrorForAI(
    "test_failure",
    "Error: expected 42n but got 42\n    at bigint.test.ts:25:30"
  );
  const prompt2 = buildPrompt(taskName, readme, buggyCode, [mockError1]);
  console.log(prompt2);
  console.log(`\n${"=".repeat(80)}`);
  console.log(`PROMPT LENGTH: ${prompt2.length} characters`);
  console.log(`${"=".repeat(80)}\n`);

  // Attempt 3: With all errors
  console.log(`\n${"=".repeat(80)}`);
  console.log(`ATTEMPT 3/3 - With All Error Feedback`);
  console.log(`${"=".repeat(80)}\n`);
  const mockError2 = formatErrorForAI(
    "test_failure",
    "Error: Type 'number' is not assignable to type 'bigint'"
  );
  const prompt3 = buildPrompt(taskName, readme, buggyCode, [mockError1, mockError2]);
  console.log(prompt3);
  console.log(`\n${"=".repeat(80)}`);
  console.log(`PROMPT LENGTH: ${prompt3.length} characters`);
  console.log(`${"=".repeat(80)}\n`);

  console.log(`\n✅ Done! These are the exact prompts that would be sent to the AI.`);
}

main().catch(console.error);
