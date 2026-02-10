#!/usr/bin/env bun
/**
 * Main benchmark orchestration script
 * Runs inference → evaluation → generates final report
 */

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
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

  // Spread array to pass each task as separate argument and save log
  const inferenceResult = await $`bun run scripts/run-inference.ts ${tasksToRun}`.nothrow();
  const inferenceLog = `logs/step1-inference-${Date.now()}.txt`;

  // Save inference log
  mkdirSync("logs", { recursive: true });
  writeFileSync(inferenceLog, inferenceResult.stdout.toString() + inferenceResult.stderr.toString(), "utf-8");
  console.log(`\n✅ Inference log saved to: ${inferenceLog}\n`);

  if (inferenceResult.exitCode !== 0) {
    console.error("⚠️  Inference had some failures (check log)");
  }

  console.log(`\n📚 STEP 2: EVALUATION`);
  console.log(`${"=".repeat(70)}`);
  const evalCmd = `bun run scripts/run-evaluation.ts ${tasksToRun.join(" ")}`;
  console.log(`Running: ${evalCmd}\n`);

  // Spread array to pass each task as separate argument and save log
  const evalResult = await $`bun run scripts/run-evaluation.ts ${tasksToRun}`.nothrow();
  const evalLog = `logs/step2-evaluation-${Date.now()}.txt`;

  // Save evaluation log
  writeFileSync(evalLog, evalResult.stdout.toString() + evalResult.stderr.toString(), "utf-8");
  console.log(`\n✅ Evaluation log saved to: ${evalLog}\n`);

  if (evalResult.exitCode !== 0) {
    console.error("⚠️  Evaluation had failures (expected for buggy tasks)");
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

  // Generate summary text
  const summaryText = `${"=".repeat(70)}
BENCHMARK SUMMARY
${"=".repeat(70)}
Model:                ${report.model}
Total Tasks:          ${report.totalTasks}
With Inference:       ${report.withInference}
Passed Evaluation:    ${report.passed} ✅
Failed Evaluation:    ${report.failed} ❌
Success Rate:         ${report.totalTasks > 0 ? ((report.passed / report.withInference) * 100).toFixed(1) : 0}%
Total Inference Time: ${(totalInferenceTime / 1000).toFixed(1)}s
Total Duration:       ${((report.totalDuration || 0) / 1000).toFixed(1)}s
${"=".repeat(70)}
`;

  // Print summary
  console.log(summaryText);
  console.log(`📝 Full report saved to: ${reportFile}`);

  // Save step 3 log (report generation summary)
  const reportLog = `logs/step3-report-${Date.now()}.txt`;
  writeFileSync(reportLog, summaryText + `\nFull JSON report saved to: ${reportFile}\n`, "utf-8");
  console.log(`📝 Report summary saved to: ${reportLog}`);
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
