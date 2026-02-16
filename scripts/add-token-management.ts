#!/usr/bin/env bun
/**
 * Script to add token management functions to run-benchmark.ts
 */

const { readFileSync, writeFileSync } = require("fs");

// Read the file
const content = readFileSync("scripts/run-benchmark.ts", "utf8");

// Find the position to insert (after getTemperature function)
const pattern = /(  return 0\.5;\n}\n\n\/\*\* \* Build prompt with optional error feedback)/;
const match = content.match(pattern);

if (match) {
  // Prepare the new functions
  const newFunctions = `
/**
 * Categorize task by complexity level
 */
function getTaskComplexity(taskName: string): 'simple' | 'medium' | 'complex' {
  if (!taskName) return 'medium';

  const taskNum = parseInt(taskName.split("-")[1]?.padStart(3, "0") || "0");

  // Simple tasks (basic operations)
  if ((taskNum >= 1 && taskNum <= 10) ||
      (taskNum >= 41 && taskNum <= 45) ||
      taskName.includes('env-vars') ||
      taskName.includes('file-write') ||
      taskName.includes('file-encoding')) {
    return 'simple';
  }

  // Complex tasks (advanced operations)
  if ((taskNum >= 31 && taskNum <= 40) ||
      (taskNum >= 57 && taskNum <= 67) ||
      taskName.includes('shell') ||
      taskName.includes('redis') ||
      taskName.includes('sql-transaction') ||
      taskName.includes('ws-broadcast') ||
      taskName.includes('import-meta')) {
    return 'complex';
  }

  // Medium complexity (everything else)
  return 'medium';
}

/**
 * Get dynamic max tokens based on task complexity and attempt number
 */
function getMaxTokens(taskName: string, attemptNumber: number): number {
  const complexity = getTaskComplexity(taskName);

  // Base token allocation by complexity
  const baseTokens = {
    'simple': 2000,    // Easy tasks need less tokens
    'medium': 4000,    // Medium complexity
    'complex': 6000     // Complex tasks need more tokens
  };

  const base = baseTokens[complexity] || 4000;

  // Increase tokens for retry attempts to provide more context
  // Attempt 1: 100%, Attempt 2: 150%, Attempt 3: 200%
  const multiplier = 1 + ((attemptNumber - 1) * 0.5);

  return Math.min(Math.floor(base * multiplier), 8000); // Cap at 8000
}

`;

  // Insert the new functions
  const insertPosition = match.index + match[1].length;
  const newContent = content.substring(0, insertPosition) + newFunctions + content.substring(insertPosition);

  // Write back
  writeFileSync("scripts/run-benchmark.ts", newContent);

  console.log("✅ Token management functions added successfully");
} else {
  console.log("❌ Pattern not found");
  process.exit(1);
}
