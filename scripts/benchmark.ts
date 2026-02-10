#!/usr/bin/env bun
/**
 * Main benchmark orchestration script
 * Runs inference → evaluation → generates final report
 */

import { readFileSync, existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const tasksDir = join(import.meta.dir, "..", "tasks");
const reportFile = join(import.meta.dir, "..", "benchmark-report.json");

interface BenchmarkTask {
  taskName: string;
  hasInference: boolean;
  inferenceDuration?: number;
  evaluationPassed?: boolean;
  evaluationDuration?: number;
  evaluationError?: string;
}

interface BenchmarkReport {
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  model: string;
  totalTasks: number;
  withInference: number;
  passed: number;
  failed: number;
  tasks: BenchmarkTask[];
}

/**
 * Run the benchmark pipeline
 */
async function runBenchmark(taskFilter?: string) {
  const allTasks = readdirSync(tasksDir)
    .filter(d => d.startsWith("task-"))
    .sort();

  const tasksToRun = taskFilter ? allTasks.filter(t => t.includes(taskFilter)) : allTasks;

  const startTime = Date.now();
  const startTimeISO = new Date().toISOString();

  console.log(`${"=".repeat(70)}`);
  console.log(`BUN BENCHMARK - FULL PIPELINE`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Model:         ${Bun.env.OPENROUTER_MODEL || "unknown"}`);
  console.log(`Tasks to run:  ${tasksToRun.length}/${allTasks.length}`);
  console.log(`${"=".repeat(70)}\n`);

  // Step 1: Run inference on all tasks
  console.log(`📡 STEP 1: INFERENCE`);
  console.log(`${"=".repeat(70)}`);
  const inferenceCmd = `bun run scripts/run-inference.ts ${tasksToRun.join(" ")}`;
  console.log(`Running: ${inferenceCmd}\n`);

  // Spread array to pass each task as separate argument
  const inferenceResult = await $`bun run scripts/run-inference.ts ${tasksToRun}`.nothrow();
  if (inferenceResult.exitCode !== 0) {
    console.error("Inference failed!");
    console.error(inferenceResult.stderr.toString());
  }

  console.log(`\n📚 STEP 2: EVALUATION`);
  console.log(`${"=".repeat(70)}`);
  const evalCmd = `bun run scripts/run-evaluation.ts ${tasksToRun.join(" ")}`;
  console.log(`Running: ${evalCmd}\n`);

  // Spread array to pass each task as separate argument
  const evalResult = await $`bun run scripts/run-evaluation.ts ${tasksToRun}`.nothrow();
  if (evalResult.exitCode !== 0) {
    console.error("Evaluation had failures (expected for buggy tasks)");
  }

  // Step 3: Generate report
  console.log(`\n📊 STEP 3: GENERATING REPORT`);
  console.log(`${"=".repeat(70)}\n`);

  const report: BenchmarkReport = {
    startTime: startTimeISO,
    model: Bun.env.OPENROUTER_MODEL || "unknown",
    totalTasks: tasksToRun.length,
    withInference: 0,
    passed: 0,
    failed: 0,
    tasks: [],
  };

  for (const taskName of tasksToRun) {
    const taskDir = join(tasksDir, taskName);
    const inferenceFile = join(taskDir, "inference-response.json");

    const task: BenchmarkTask = {
      taskName,
      hasInference: existsSync(inferenceFile),
    };

    if (task.hasInference) {
      report.withInference++;

      // Read inference duration from inference-response.json
      try {
        const inferenceData = JSON.parse(readFileSync(inferenceFile, "utf-8"));
        task.inferenceDuration = inferenceData.inferenceDuration;
      } catch (e) {
        console.log(`  Warning: Could not parse ${inferenceFile}`);
      }

      // Try to find evaluation result in task directory
      // (This would be saved by evaluation script)
      const evalFile = join(taskDir, "evaluation-result.json");
      if (existsSync(evalFile)) {
        try {
          const evalData = JSON.parse(readFileSync(evalFile, "utf-8"));
          task.evaluationPassed = evalData.passed;
          task.evaluationDuration = evalData.duration;
          task.evaluationError = evalData.error;

          if (evalData.passed) {
            report.passed++;
          } else {
            report.failed++;
          }
        } catch (e) {
          console.log(`  Warning: Could not parse ${evalFile}`);
        }
      }
    }

    report.tasks.push(task);
  }

  const endTime = Date.now();
  report.endTime = new Date().toISOString();
  report.totalDuration = endTime - startTime;

  // Save report
  writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf-8");

  // Calculate total inference time
  const totalInferenceTime = report.tasks
    .filter(t => t.inferenceDuration)
    .reduce((sum, t) => sum + (t.inferenceDuration || 0), 0);

  // Print summary
  console.log(`${"=".repeat(70)}`);
  console.log(`BENCHMARK SUMMARY`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Model:                ${report.model}`);
  console.log(`Total Tasks:          ${report.totalTasks}`);
  console.log(`With Inference:       ${report.withInference}`);
  console.log(`Passed Evaluation:    ${report.passed} ✅`);
  console.log(`Failed Evaluation:    ${report.failed} ❌`);
  console.log(`Success Rate:         ${report.totalTasks > 0 ? ((report.passed / report.withInference) * 100).toFixed(1) : 0}%`);
  console.log(`Total Inference Time: ${(totalInferenceTime / 1000).toFixed(1)}s`);
  console.log(`Total Duration:       ${((report.totalDuration || 0) / 1000).toFixed(1)}s`);
  console.log(`${"=".repeat(70)}`);
  console.log(`\n📝 Full report saved to: ${reportFile}`);
}

// Main
const args = process.argv.slice(2);
const taskFilter = args[0];

if (taskFilter === "--help") {
  console.log("Usage: bun run scripts/benchmark.ts [task-filter]");
  console.log("Examples:");
  console.log("  bun run scripts/benchmark.ts              # Run all tasks");
  console.log("  bun run scripts/benchmark.ts task-001    # Run tasks matching 'task-001'");
  process.exit(0);
}

runBenchmark(taskFilter).catch(console.error);
