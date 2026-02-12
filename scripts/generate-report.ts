#!/usr/bin/env bun
/**
 * Generate benchmark summary report from evaluation results
 * Aggregates all task results and generates per-category statistics
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const tasksDir = join(import.meta.dir, "..", "tasks");

interface EvaluationResult {
  taskName: string;
  passed: boolean;
  duration: number;
  timestamp: string;
  error?: string;
  errorType?: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
}

interface TaskMetadata {
  type: string;
  category: string;
  difficulty: string;
}

interface InferenceResult {
  taskName: string;
  model: string;
  timestamp: string;
  inferenceDuration: number;
  prompt: string;
  response: string;
}

interface TaskCategory {
  name: string;
  tasks: string[];
}

interface BenchmarkReport {
  model: string;
  generatedAt: string;
  summary: {
    totalTasks: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    avgInferenceDuration: number;
    avgTestDuration: number;
    totalInferenceTime: number;
    totalTokensUsed: number;
  };
  byCategory: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  };
  byDifficulty: {
    [difficulty: string]: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  };
  byType: {
    [type: string]: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  };
  byErrorType: {
    [errorType: string]: {
      count: number;
      percentage: number;
    };
  };
  failedTasks: {
    taskName: string;
    errorType?: string;
    error?: string;
  }[];
  taskDetails: {
    taskName: string;
    passed: boolean;
    inferenceDuration?: number;
    testDuration: number;
    errorType?: string;
    testsPassed?: number;
    testsRun?: number;
  }[];
}

// Task categories based on README.md
const categories: TaskCategory[] = [
  { name: "HTTP Server", tasks: ["task-001", "task-002", "task-003", "task-004", "task-005"] },
  { name: "SQLite", tasks: ["task-006", "task-007", "task-008", "task-009", "task-010"] },
  { name: "File I/O", tasks: ["task-011", "task-012", "task-013", "task-014", "task-015"] },
  { name: "Testing", tasks: ["task-016", "task-017", "task-018", "task-019", "task-020"] },
  { name: "WebSocket", tasks: ["task-021", "task-022", "task-023", "task-024", "task-025"] },
  { name: "HTTP Client", tasks: ["task-026", "task-027", "task-028", "task-029", "task-030"] },
  { name: "Bundler", tasks: ["task-031", "task-032", "task-033", "task-034", "task-035"] },
  { name: "Crypto", tasks: ["task-036", "task-037", "task-038", "task-039", "task-040"] },
  { name: "Environment", tasks: ["task-041", "task-042", "task-043", "task-044", "task-045"] },
  { name: "Shell/CLI", tasks: ["task-046", "task-047", "task-048", "task-049", "task-050"] },
  { name: "TCP/UDP", tasks: ["task-051", "task-052", "task-053"] },
  { name: "Redis", tasks: ["task-054", "task-055", "task-056"] },
  { name: "PostgreSQL", tasks: ["task-057", "task-058", "task-059", "task-060"] },
  { name: "Streams", tasks: ["task-061", "task-062", "task-063", "task-064"] },
  { name: "HTMLRewriter", tasks: ["task-065", "task-066", "task-067"] },
  { name: "Glob", tasks: ["task-068", "task-069"] },
  { name: "Workers", tasks: ["task-070", "task-071", "task-072"] },
  { name: "Cookies", tasks: ["task-073", "task-074"] },
  { name: "Semver", tasks: ["task-075", "task-076"] },
  { name: "Snapshots", tasks: ["task-077", "task-078"] },
  { name: "Compile", tasks: ["task-079", "task-080"] },
];

const difficultyLevels: { [task: string]: string } = {};

// Mark easy tasks
["001-010", "041-045", "073-076"].forEach(range => {
  const [start, end] = range.split("-").map(Number);
  for (let i = start; i <= end; i++) {
    difficultyLevels[`task-${i.toString().padStart(3, "0")}`] = "Easy";
  }
});

// Mark medium tasks
["011-030", "051-056", "068-072"].forEach(range => {
  const [start, end] = range.split("-").map(Number);
  for (let i = start; i <= end; i++) {
    difficultyLevels[`task-${i.toString().padStart(3, "0")}`] = "Medium";
  }
});

// Mark hard tasks
["031-040", "046-050", "057-067", "077-080"].forEach(range => {
  const [start, end] = range.split("-").map(Number);
  for (let i = start; i <= end; i++) {
    difficultyLevels[`task-${i.toString().padStart(3, "0")}`] = "Hard";
  }
});

/**
 * Get category for a task
 */
function getCategory(taskName: string): string {
  const taskPrefix = taskName.split("-")[1] ? taskName : taskName;
  const taskNum = taskPrefix.split("-")[1];

  for (const category of categories) {
    if (category.tasks.some(t => taskName.includes(t))) {
      return category.name;
    }
  }
  return "Other";
}

/**
 * Get difficulty for a task
 */
function getDifficulty(taskName: string): string {
  const taskPrefix = taskName.split("-")[1] ? taskName : taskName;
  const taskNum = taskPrefix.split("-")[1];
  return difficultyLevels[taskPrefix] || "Unknown";
}

/**
 * Load task metadata
 */
function loadTaskMetadata(): Map<string, TaskMetadata> {
  const metadataFile = join(tasksDir, "tasks-metadata.json");

  if (!existsSync(metadataFile)) {
    console.warn("⚠️  tasks-metadata.json not found, using defaults");
    return new Map();
  }

  const metadata = JSON.parse(readFileSync(metadataFile, "utf-8"));
  const map = new Map<string, TaskMetadata>();

  for (const [taskName, data] of Object.entries(metadata.tasks)) {
    map.set(taskName, data as TaskMetadata);
  }

  return map;
}

/**
 * Load all evaluation results
 */
function loadResults(): {
  evaluations: Map<string, EvaluationResult>;
  inferences: Map<string, InferenceResult>;
  model: string;
  metadata: Map<string, TaskMetadata>;
} {
  const evaluations = new Map<string, EvaluationResult>();
  const inferences = new Map<string, InferenceResult>();
  let model = "unknown";
  const metadata = loadTaskMetadata();

  const taskDirs = readdirSync(tasksDir)
    .filter(d => d.startsWith("task-"))
    .sort();

  for (const taskDir of taskDirs) {
    const evalFile = join(tasksDir, taskDir, "evaluation-result.json");
    const inferFile = join(tasksDir, taskDir, "inference-response.json");

    if (existsSync(evalFile)) {
      const evalData = JSON.parse(readFileSync(evalFile, "utf-8")) as EvaluationResult;
      evaluations.set(taskDir, evalData);
    }

    if (existsSync(inferFile)) {
      const inferData = JSON.parse(readFileSync(inferFile, "utf-8")) as InferenceResult;
      inferences.set(taskDir, inferData);
      if (inferData.model && inferData.model !== "unknown") {
        model = inferData.model;
      }
    }
  }

  return { evaluations, inferences, model, metadata };
}

/**
 * Generate benchmark report
 */
function generateReport(): BenchmarkReport {
  const { evaluations, inferences, model, metadata } = loadResults();

  let totalTasks = 0;
  let passed = 0;
  let failed = 0;
  let totalInferenceTime = 0;
  let totalTestTime = 0;
  let totalTokensUsed = 0;
  let inferenceCount = 0;

  const byCategory: { [category: string]: { total: number; passed: number; failed: number } } = {};
  const byDifficulty: { [difficulty: string]: { total: number; passed: number; failed: number } } = {};
  const byType: { [type: string]: { total: number; passed: number; failed: number } } = {};
  const byErrorType: { [errorType: string]: number } = {};
  const failedTasks: { taskName: string; errorType?: string; error?: string }[] = [];
  const taskDetails: {
    taskName: string;
    passed: boolean;
    inferenceDuration?: number;
    testDuration: number;
    errorType?: string;
    testsPassed?: number;
    testsRun?: number;
  }[] = [];

  // Process all tasks
  const allTaskDirs = readdirSync(tasksDir)
    .filter(d => d.startsWith("task-"))
    .sort();

  for (const taskDir of allTaskDirs) {
    totalTasks++;
    const category = getCategory(taskDir);
    const difficulty = getDifficulty(taskDir);
    const taskMeta = metadata.get(taskDir);
    const taskType = taskMeta?.type || "unknown";

    // Initialize category/difficulty/type if needed
    if (!byCategory[category]) {
      byCategory[category] = { total: 0, passed: 0, failed: 0 };
    }
    if (!byDifficulty[difficulty]) {
      byDifficulty[difficulty] = { total: 0, passed: 0, failed: 0 };
    }
    if (!byType[taskType]) {
      byType[taskType] = { total: 0, passed: 0, failed: 0 };
    }

    const evaluation = evaluations.get(taskDir);
    const inference = inferences.get(taskDir);

    if (evaluation) {
      if (evaluation.passed) {
        passed++;
        byCategory[category].passed++;
        byDifficulty[difficulty].passed++;
        byType[taskType].passed++;
      } else {
        failed++;
        byCategory[category].failed++;
        byDifficulty[difficulty].failed++;
        byType[taskType].failed++;

        const errorType = evaluation.errorType || "unknown";
        byErrorType[errorType] = (byErrorType[errorType] || 0) + 1;

        failedTasks.push({
          taskName: taskDir,
          errorType,
          error: evaluation.error?.substring(0, 100),
        });
      }

      totalTestTime += evaluation.duration;

      taskDetails.push({
        taskName: taskDir,
        passed: evaluation.passed,
        inferenceDuration: inference?.inferenceDuration,
        testDuration: evaluation.duration,
        errorType: evaluation.errorType,
        testsPassed: evaluation.testsPassed,
        testsRun: evaluation.testsRun,
      });
    }

    if (inference) {
      totalInferenceTime += inference.inferenceDuration;
      if (inference.tokensUsed) {
        totalTokensUsed += inference.tokensUsed;
      }
      inferenceCount++;
    }

    byCategory[category].total++;
    byDifficulty[difficulty].total++;
    byType[taskType].total++;
  }

  const skipped = totalTasks - evaluations.size;

  // Calculate pass rates
  const categoryRates: { [category: string]: { total: number; passed: number; failed: number; passRate: number } } = {};
  for (const [cat, data] of Object.entries(byCategory)) {
    categoryRates[cat] = { ...data, passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0 };
  }

  const difficultyRates: { [difficulty: string]: { total: number; passed: number; failed: number; passRate: number } } = {};
  for (const [diff, data] of Object.entries(byDifficulty)) {
    difficultyRates[diff] = { ...data, passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0 };
  }

  const typeRates: { [type: string]: { total: number; passed: number; failed: number; passRate: number } } = {};
  for (const [type, data] of Object.entries(byType)) {
    typeRates[type] = { ...data, passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0 };
  }

  const errorTypeRates: { [errorType: string]: { count: number; percentage: number } } = {};
  for (const [errorType, count] of Object.entries(byErrorType)) {
    errorTypeRates[errorType] = {
      count,
      percentage: failed > 0 ? (count / failed) * 100 : 0,
    };
  }

  return {
    model,
    generatedAt: new Date().toISOString(),
    summary: {
      totalTasks,
      passed,
      failed,
      skipped,
      passRate: evaluations.size > 0 ? (passed / evaluations.size) * 100 : 0,
      avgInferenceDuration: inferenceCount > 0 ? totalInferenceTime / inferenceCount : 0,
      avgTestDuration: evaluations.size > 0 ? totalTestTime / evaluations.size : 0,
      totalInferenceTime,
      totalTokensUsed,
    },
    byCategory: categoryRates,
    byDifficulty: difficultyRates,
    byType: typeRates,
    byErrorType: errorTypeRates,
    failedTasks,
    taskDetails,
  };
}

/**
 * Save report to file
 */
function saveReport(report: BenchmarkReport, filename: string): void {
  writeFileSync(filename, JSON.stringify(report, null, 2), "utf-8");
}

/**
 * Detect anomalous patterns in results
 */
function detectAnomalies(report: BenchmarkReport): string[] {
  const anomalies: string[] = [];

  // Check if all tasks failed with same error
  const errorCounts = Object.entries(report.byErrorType);
  if (report.failed > 10 && errorCounts.length === 1) {
    const [errorType, data] = errorCounts[0];
    if (data.count === report.failed) {
      anomalies.push(`⚠️ **All failures** are of type "${errorType}" - may indicate systemic issue`);
    }
  }

  // Check for outlier categories (all failed or all passed)
  for (const [category, data] of Object.entries(report.byCategory)) {
    if (data.total >= 5 && data.passed === 0) {
      anomalies.push(`⚠️ **${category}**: 0% pass rate (${data.total}/${data.total} failed)`);
    } else if (data.total >= 5 && data.passed === data.total) {
      anomalies.push(`✅ **${category}**: 100% pass rate (${data.total}/${data.total} passed)`);
    }
  }

  // Check if pass rate is very low
  if (report.summary.passed + report.summary.failed > 20 && report.summary.passRate < 20) {
    anomalies.push(`⚠️ **Very low pass rate** (${report.summary.passRate.toFixed(1)}%) - may need prompt/model adjustment`);
  }

  return anomalies;
}

/**
 * Generate markdown report
 */
function generateMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];

  lines.push(`# Bun Benchmark - ${report.model}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push("");

  // Anomalies section
  const anomalies = detectAnomalies(report);
  if (anomalies.length > 0) {
    lines.push("## 📊 Anomaly Detection");
    lines.push("");
    for (const anomaly of anomalies) {
      lines.push(`- ${anomaly}`);
    }
    lines.push("");
  }

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Tasks | ${report.summary.totalTasks} |`);
  lines.push(`| Evaluated | ${report.summary.passed + report.summary.failed} |`);
  lines.push(`| Skipped | ${report.summary.skipped} |`);
  lines.push(`| **Passed** | **${report.summary.passed} ✅** |`);
  lines.push(`| **Failed** | **${report.summary.failed} ❌** |`);
  lines.push(`| **Pass Rate** | **${report.summary.passRate.toFixed(1)}%** |`);
  lines.push(`| Avg Inference Time | ${report.summary.avgInferenceDuration.toFixed(0)}ms |`);
  lines.push(`| Avg Test Time | ${report.summary.avgTestDuration.toFixed(0)}ms |`);
  lines.push(`| Total Inference Time | ${(report.summary.totalInferenceTime / 1000 / 60).toFixed(1)}min |`);
  if (report.summary.totalTokensUsed > 0) {
    lines.push(`| Total Tokens Used | ${report.summary.totalTokensUsed.toLocaleString()} |`);
    lines.push(`| Tokens per Task | ${(report.summary.totalTokensUsed / (report.summary.passed + report.summary.failed)).toFixed(0)} |`);
  }
  lines.push("");

  // By Task Type
  lines.push("## Results by Task Type");
  lines.push("");
  lines.push(`| Type | Total | Passed | Failed | Pass Rate |`);
  lines.push(`|-----|-------|--------|--------|-----------|`);

  const sortedTypes = Object.entries(report.byType).sort((a, b) => b[1].passRate - a[1].passRate);

  for (const [type, data] of sortedTypes) {
    lines.push(`| ${type} | ${data.total} | ${data.passed} | ${data.failed} | ${data.passRate.toFixed(1)}% |`);
  }
  lines.push("");

  // By Error Type
  if (Object.keys(report.byErrorType).length > 0) {
    lines.push("## Error Breakdown");
    lines.push("");
    lines.push(`| Error Type | Count | Percentage |`);
    lines.push(`|------------|-------|------------|`);

    const sortedErrors = Object.entries(report.byErrorType).sort((a, b) => b[1].count - a[1].count);

    for (const [errorType, data] of sortedErrors) {
      lines.push(`| ${errorType} | ${data.count} | ${data.percentage.toFixed(1)}% |`);
    }
    lines.push("");
  }

  // By Category
  lines.push("## Results by Category");
  lines.push("");
  lines.push(`| Category | Total | Passed | Failed | Pass Rate |`);
  lines.push(`|----------|-------|--------|--------|-----------|`);

  const sortedCategories = Object.entries(report.byCategory).sort((a, b) => b[1].passRate - a[1].passRate);

  for (const [category, data] of sortedCategories) {
    lines.push(`| ${category} | ${data.total} | ${data.passed} | ${data.failed} | ${data.passRate.toFixed(1)}% |`);
  }
  lines.push("");

  // By Difficulty
  lines.push("## Results by Difficulty");
  lines.push("");
  lines.push(`| Difficulty | Total | Passed | Failed | Pass Rate |`);
  lines.push(`|------------|-------|--------|--------|-----------|`);

  for (const [difficulty, data] of Object.entries(report.byDifficulty)) {
    lines.push(`| ${difficulty} | ${data.total} | ${data.passed} | ${data.failed} | ${data.passRate.toFixed(1)}% |`);
  }
  lines.push("");

  // Failed Tasks (top 10 only to reduce clutter)
  if (report.failedTasks.length > 0) {
    lines.push("## Failed Tasks");
    lines.push("");
    const tasksToShow = report.failedTasks.slice(0, 10);
    for (const task of tasksToShow) {
      lines.push(`### ${task.taskName} (${task.errorType})`);
      if (task.error) {
        lines.push(`\`\`\``);
        lines.push(task.error);
        lines.push(`\`\`\``);
      }
      lines.push("");
    }
    if (report.failedTasks.length > 10) {
      lines.push(`*... and ${report.failedTasks.length - 10} more failed tasks*`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Main
 */
async function main() {
  console.log(`${"=".repeat(60)}`);
  console.log(`GENERATING BENCHMARK REPORT`);
  console.log(`${"=".repeat(60)}\n`);

  const report = generateReport();

  // Save JSON report
  const jsonReportFile = join(import.meta.dir, "..", "benchmark-results.json");
  saveReport(report, jsonReportFile);
  console.log(`✅ Saved JSON report to: ${jsonReportFile}`);

  // Save markdown report
  const markdown = generateMarkdown(report);
  const mdReportFile = join(import.meta.dir, "..", "BENCHMARK_REPORT.md");
  writeFileSync(mdReportFile, markdown, "utf-8");
  console.log(`✅ Saved markdown report to: ${mdReportFile}`);

  // Print summary
  console.log("");
  console.log(`${"=".repeat(60)}`);
  console.log(`BENCHMARK SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Model: ${report.model}`);
  console.log(`Total Tasks: ${report.summary.totalTasks}`);
  console.log(`Evaluated: ${report.summary.passed + report.summary.failed}`);
  console.log(`Passed: ${report.summary.passed} ✅`);
  console.log(`Failed: ${report.summary.failed} ❌`);
  console.log(`Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
  console.log(`Avg Inference: ${report.summary.avgInferenceDuration.toFixed(0)}ms`);
  console.log(`Total Inference Time: ${(report.summary.totalInferenceTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
