#!/usr/bin/env bun
/**
 * Test all solutions in the benchmark tasks.
 *
 * Features:
 * - Measures execution time for each task
 * - Logs results to JSON file for persistence
 * - Skips already completed tasks (can resume from interruptions)
 * - Tracks detailed errors and provides summary reports
 *
 * Most tasks: symlink src -> solution, run tests, restore
 * Test-focused tasks (016-020, 077-078): run solution/*.test.ts directly
 * Build tasks (031-035, 080): copy solution files into src, keeping original source files
 */

import { readdirSync, existsSync, renameSync, symlinkSync, unlinkSync, copyFileSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from "fs";
import { join, basename, relative } from "path";
import { $ } from "bun";

const tasksDir = join(import.meta.dir, "..", "tasks");
const logFile = join(import.meta.dir, "..", "benchmark-results.json");

interface TaskResult {
  taskName: string;
  status: "pass" | "fail" | "skipped" | "no-solution";
  duration: number;
  timestamp: string;
  error?: string;
}

interface BenchmarkResults {
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  model?: string;
  totalTasks: number;
  passed: number;
  failed: number;
  skipped: number;
  noSolution: number;
  tasks: TaskResult[];
}

// Tasks where the test file IS the buggy code and solution contains fixed test file
const TEST_FOCUSED_TASKS = [
  "task-016-test-async",
  "task-017-mock-cleanup",
  "task-018-expect-type",
  "task-019-test-timeout",
  "task-020-describe-scope",
  "task-077-snapshot-object",
  "task-078-snapshot-inline",
];

// Tasks where solution has build/config files that need to coexist with source files
// These tasks have both source files (main.ts, etc) and buggy build.ts in src/
// Solution only contains fixed build.ts, so we copy it into src/ instead of symlinking
const COPY_SOLUTION_TASKS = [
  "task-031-build-entry",
  "task-032-build-external",
  "task-033-build-outdir",
  "task-034-build-minify",
  "task-035-build-target",
  "task-045-import-meta",
  "task-080-compile-target",
];

/**
 * Copy directory recursively (for Windows compatibility - avoids symlink issues)
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const files = readdirSync(src);
  for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively (for cleanup)
 */
function removeDir(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * Load previous results to skip completed tasks
 */
function loadPreviousResults(): BenchmarkResults | null {
  if (!existsSync(logFile)) {
    return null;
  }

  try {
    const data = readFileSync(logFile, "utf-8");
    return JSON.parse(data) as BenchmarkResults;
  } catch (error) {
    console.warn(`Warning: Could not load previous results: ${error}`);
    return null;
  }
}

/**
 * Save results to JSON file
 */
function saveResults(results: BenchmarkResults): void {
  try {
    writeFileSync(logFile, JSON.stringify(results, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error saving results: ${error}`);
  }
}

/**
 * Check if a task was already completed in previous run
 */
function isTaskCompleted(previousResults: BenchmarkResults | null, taskName: string): boolean {
  if (!previousResults) {
    return false;
  }

  const task = previousResults.tasks.find(t => t.taskName === taskName);
  return task?.status === "pass" || task?.status === "skipped" || task?.status === "no-solution";
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

async function testSolution(taskDir: string): Promise<{ passed: boolean; duration: number; error?: string }> {
  const taskName = taskDir.split("/").pop()!;
  const srcDir = join(taskDir, "src");
  const srcBakDir = join(taskDir, "src.bak");
  const solutionDir = join(taskDir, "solution");

  const startTime = performance.now();

  if (!existsSync(solutionDir)) {
    return { passed: true, duration: 0, error: "No solution directory" };
  }

  try {
    let result;

    if (TEST_FOCUSED_TASKS.includes(taskName)) {
      // For test-focused tasks, run solution tests directly
      result = await $`cd ${taskDir} && bun test solution/`.nothrow();
    } else if (COPY_SOLUTION_TASKS.includes(taskName)) {
      // For build tasks, copy solution files into src (keeping original source files)
      const solutionFiles = readdirSync(solutionDir);
      const backedUpFiles: string[] = [];

      // Backup existing files that will be overwritten
      for (const file of solutionFiles) {
        const srcFile = join(srcDir, file);
        const bakFile = join(srcDir, `${file}.bak`);
        if (existsSync(srcFile)) {
          renameSync(srcFile, bakFile);
          backedUpFiles.push(file);
        }
        // Copy solution file to src
        copyFileSync(join(solutionDir, file), srcFile);
      }

      result = await $`cd ${taskDir} && bun test`.nothrow();

      // Restore backed up files
      for (const file of solutionFiles) {
        const srcFile = join(srcDir, file);
        const bakFile = join(srcDir, `${file}.bak`);
        unlinkSync(srcFile);
        if (existsSync(bakFile)) {
          renameSync(bakFile, srcFile);
        }
      }
    } else {
      // For regular tasks, copy solution to src (avoiding symlink issues on Windows)
      if (existsSync(srcDir)) {
        renameSync(srcDir, srcBakDir);
      }

      copyDirRecursive(solutionDir, srcDir);

      result = await $`cd ${taskDir} && bun test`.nothrow();

      // Restore original src
      removeDir(srcDir);
      if (existsSync(srcBakDir)) {
        renameSync(srcBakDir, srcDir);
      }
    }

    const duration = performance.now() - startTime;
    const passed = result.exitCode === 0;

    return {
      passed,
      duration,
      error: passed ? undefined : result.stderr.toString().trim()
    };
  } catch (error) {
    // Restore src on error
    if (existsSync(srcBakDir) && !existsSync(srcDir)) {
      try {
        removeDir(srcDir);
      } catch {}
      renameSync(srcBakDir, srcDir);
    }

    const duration = performance.now() - startTime;
    return { passed: false, duration, error: String(error) };
  }
}

/**
 * Print summary report
 */
function printSummary(results: BenchmarkResults): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`BENCHMARK SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Model:           ${results.model}`);
  console.log(`Total Tasks:     ${results.totalTasks}`);
  console.log(`Passed:          ${results.passed} ✅`);
  console.log(`Failed:          ${results.failed} ❌`);
  console.log(`Skipped:         ${results.skipped} ⏭️`);
  console.log(`No Solution:     ${results.noSolution} ⚠️`);
  console.log(`Total Duration:  ${formatDuration(results.totalDuration || 0)}`);
  console.log(`Success Rate:    ${results.totalTasks > 0 ? ((results.passed / results.totalTasks) * 100).toFixed(1) : 0}%`);

  if (results.failed > 0) {
    console.log(`\n❌ Failed Tasks:`);
    for (const task of results.tasks.filter(t => t.status === "fail")) {
      console.log(`   - ${task.taskName} (${formatDuration(task.duration)})`);
      if (task.error) {
        console.log(`     Error: ${task.error.split('\n')[0]}`);
      }
    }
  }

  if (results.skipped > 0) {
    console.log(`\n⏭️  Skipped Tasks (already completed):`);
    for (const task of results.tasks.filter(t => t.status === "skipped")) {
      console.log(`   - ${task.taskName}`);
    }
  }

  console.log(`\n📝 Results saved to: ${logFile}`);
  console.log(`${"=".repeat(60)}`);
}

async function main() {
  const startTime = Date.now();

  console.log(`${"=".repeat(60)}`);
  console.log(`BUN BENCHMARK TEST SOLUTIONS`);
  console.log(`${"=".repeat(60)}`);  console.log(`Model: ${Bun.env.OPENROUTER_MODEL || "default"}`);  console.log(`Starting comprehensive benchmark analysis...\n`);

  // Load previous results to skip completed tasks
  const previousResults = loadPreviousResults();
  if (previousResults) {
    console.log(`Found previous results from ${previousResults.startTime}`);
    console.log(`Previously completed: ${previousResults.passed + previousResults.skipped + previousResults.noSolution}/${previousResults.totalTasks}\n`);
  }

  const tasks = readdirSync(tasksDir)
    .filter(d => d.startsWith("task-"))
    .sort();

  const results: BenchmarkResults = {
    startTime: new Date().toISOString(),
    model: Bun.env.OPENROUTER_MODEL || "unknown",
    totalTasks: tasks.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    noSolution: 0,
    tasks: [],
  };

  // Inherit previous results for skipped tasks
  if (previousResults) {
    for (const prevTask of previousResults.tasks) {
      if (isTaskCompleted(previousResults, prevTask.taskName)) {
        results.tasks.push({
          ...prevTask,
          status: prevTask.status === "pass" ? "skipped" : prevTask.status,
        });
        if (prevTask.status === "pass") results.skipped++;
        else if (prevTask.status === "no-solution") results.noSolution++;
      }
    }
  }

  let completedCount = 0;

  for (const task of tasks) {
    const taskDir = join(tasksDir, task);
    const taskName = task;

    // Skip if already completed in previous run
    if (isTaskCompleted(previousResults, taskName)) {
      console.log(`⏭️  ${taskName} - Skipping (already completed)`);
      continue;
    }

    completedCount++;
    console.log(`\n[${completedCount}/${tasks.length - results.skipped}] Testing ${taskName}...`);

    const testResult = await testSolution(taskDir);

    const taskResult: TaskResult = {
      taskName,
      status: testResult.passed ? "pass" : "fail",
      duration: testResult.duration,
      timestamp: new Date().toISOString(),
      error: testResult.error,
    };

    // Check for no solution
    if (!existsSync(join(taskDir, "solution"))) {
      taskResult.status = "no-solution";
      results.noSolution++;
    } else if (testResult.passed) {
      results.passed++;
      console.log(`  ✅ PASSED (${formatDuration(testResult.duration)})`);
    } else {
      results.failed++;
      console.log(`  ❌ FAILED (${formatDuration(testResult.duration)})`);
      if (testResult.error) {
        const errorLines = testResult.error.split('\n');
        console.log(`     Error: ${errorLines[0]}`);
        if (errorLines.length > 1) {
          console.log(`     ${errorLines.slice(1, 3).join('\n     ')}`);
        }
      }
    }

    results.tasks.push(taskResult);

    // Save results after each task for resilience
    results.endTime = new Date().toISOString();
    results.totalDuration = Date.now() - startTime;
    saveResults(results);
  }

  printSummary(results);

  // Exit with error code if there are failures
  process.exit(results.failed > 0 ? 1 : 0);
}

main();
