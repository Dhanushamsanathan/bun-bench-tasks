#!/usr/bin/env bun
/**
 * Task Generator Script
 * Reads bun-bug-fix.txt and generates task directories with template structure
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface BugEntry {
  number: number;
  type: "Bug Fix" | "Feature";
  title: string;
  description: string;
  taskId: string;
  taskName: string;
}

function parseBugFile(content: string): BugEntry[] {
  const lines = content.split("\n");
  const entries: BugEntry[] = [];
  let currentEntry: Partial<BugEntry> | null = null;

  for (const line of lines) {
    // Match lines like "1. [Bug Fix] Title..."
    const match = line.match(/^(\d+)\.\s+\[(Bug Fix|Feature)\]\s+(.+?)(?:\.\s+Reproduce with:|\. Implement|\. The |\. Add |\. Should |\. Profile |\. Match |\. Fix )/);

    if (match) {
      // Save previous entry
      if (currentEntry && currentEntry.number) {
        entries.push(currentEntry as BugEntry);
      }

      // Start new entry
      const number = parseInt(match[1]);
      const type = match[2] as "Bug Fix" | "Feature";
      const title = match[3].trim();
      const taskId = `task-${String(number + 80).padStart(3, "0")}`; // Start from 081
      const taskName = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      currentEntry = {
        number,
        type,
        title,
        description: "",
        taskId,
        taskName: `${taskId}-${taskName}`,
      };
    } else if (currentEntry && line.trim()) {
      // Append to description
      currentEntry.description += line.trim() + " ";
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentEntry.number) {
    entries.push(currentEntry as BugEntry);
  }

  return entries;
}

function generateTaskDirectory(entry: BugEntry, tasksDir: string) {
  const taskDir = join(tasksDir, entry.taskName);

  // Skip if already exists
  if (existsSync(taskDir)) {
    console.log(`  ⏭️  Skipping ${entry.taskName} (already exists)`);
    return;
  }

  // Create directory structure
  mkdirSync(join(taskDir, "src"), { recursive: true });
  mkdirSync(join(taskDir, "test"), { recursive: true });
  mkdirSync(join(taskDir, "solution"), { recursive: true });

  // Generate README.md
  const readme = generateReadme(entry);
  writeFileSync(join(taskDir, "README.md"), readme, "utf-8");

  // Generate placeholder files
  const srcPlaceholder = generateSrcPlaceholder(entry);
  const testPlaceholder = generateTestPlaceholder(entry);
  const solutionPlaceholder = generateSolutionPlaceholder(entry);

  writeFileSync(join(taskDir, "src", "index.ts"), srcPlaceholder, "utf-8");
  writeFileSync(join(taskDir, "test", "index.test.ts"), testPlaceholder, "utf-8");
  writeFileSync(join(taskDir, "solution", "index.ts"), solutionPlaceholder, "utf-8");

  console.log(`  ✅ Created ${entry.taskName}`);
}

function generateReadme(entry: BugEntry): string {
  const emoji = entry.type === "Bug Fix" ? "🐛" : "✨";

  return `# ${entry.taskId}: ${entry.title}

${emoji} **Type:** ${entry.type}

## Problem Description

${entry.description}

## Bug

<!-- TODO: Describe the buggy behavior here -->

## Expected Behavior

<!-- TODO: Describe what should happen -->

## Steps to Reproduce

\`\`\`typescript
// TODO: Add reproduction code
\`\`\`



## Solution

<!-- TODO: Describe the fix -->

## Files

- \`src/index.ts\` - Buggy implementation
- \`test/index.test.ts\` - Tests (fail with buggy code, pass with solution)
- \`solution/index.ts\` - Fixed implementation

## Testing

\`\`\`bash
cd ${entry.taskName}
bun test
\`\`\`
`;
}

function generateSrcPlaceholder(entry: BugEntry): string {
  return `/**
 * ${entry.title}
 *
 * TODO: Implement buggy code here
 * The buggy implementation should cause the tests to fail
 */

// BUGGY CODE PLACEHOLDER
// Replace this with actual buggy implementation

export function buggyFunction() {
  // TODO: Implement buggy version
  throw new Error("Not implemented");
}
`;
}

function generateTestPlaceholder(entry: BugEntry): string {
  return `import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("${entry.title}", () => {
  // TODO: Add setup code if needed

  it("should demonstrate the bug", () => {
    // TODO: Add test that fails with buggy code
    expect(true).toBe(true);
  });

  // TODO: Add more tests to cover edge cases
});
`;
}

function generateSolutionPlaceholder(entry: BugEntry): string {
  return `/**
 * ${entry.title} - FIXED VERSION
 *
 * TODO: Implement the correct fix here
 * All tests should pass with this implementation
 */

// FIXED CODE PLACEHOLDER
// Replace this with actual solution

export function buggyFunction() {
  // TODO: Implement fixed version
  throw new Error("Not implemented");
}
`;
}

async function main() {
  console.log(`${"=".repeat(70)}`);
  console.log("BUN BENCHMARK - TASK GENERATOR");
  console.log(`${"=".repeat(70)}\n`);

  // Read bug file
  const bugFile = join(import.meta.dir, "..", "bun-bug-fix.txt");
  console.log(`📖 Reading ${bugFile}...`);

  const content = readFileSync(bugFile, "utf-8");
  const entries = parseBugFile(content);

  console.log(`\n📝 Found ${entries.length} bug entries\n`);
  console.log(`${"=".repeat(70)}\n`);

  // Generate task directories in separate folder
  const tasksDir = join(import.meta.dir, "..", "tasks-advanced");
  console.log(`📁 Generating tasks in: ${tasksDir}\n`);

  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const taskDir = join(tasksDir, entry.taskName);
    if (existsSync(taskDir)) {
      skipped++;
    } else {
      generateTaskDirectory(entry, tasksDir);
      created++;
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`GENERATION COMPLETE`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Created: ${created} tasks`);
  console.log(`Skipped: ${skipped} tasks (already exist)`);
  console.log(`Total:   ${entries.length} tasks`);
  console.log(`${"=".repeat(70)}`);
  console.log(`\n📝 Next Steps:`);
  console.log(`1. For each task, implement the buggy code in src/`);
  console.log(`2. Write tests in test/ that fail with buggy code`);
  console.log(`3. Implement the solution in solution/`);
  console.log(`4. Verify: cd task-XXX && bun test`);
  console.log(`5. Run benchmark: bun run scripts/benchmark.ts`);
  console.log(`${"=".repeat(70)}\n`);
}

main().catch(console.error);
