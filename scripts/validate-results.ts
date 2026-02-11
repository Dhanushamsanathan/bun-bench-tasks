#!/usr/bin/env bun
/**
 * Validation script: Re-run tests on passed tasks to verify reproducibility
 * Ensures that passing results are consistent across multiple runs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const tasksDir = join(import.meta.dir, "..", "tasks");

interface ValidationResult {
  taskName: string;
  originalPassed: boolean;
  validated: boolean;
  attempts: number;
  failures: number;
  consistent: boolean;
  timestamp: string;
}

/**
 * Re-run tests multiple times to check consistency
 */
async function validateTask(taskName: string, runs: number = 3): Promise<ValidationResult> {
  const taskDir = join(tasksDir, taskName);
  const evalFile = join(taskDir, "evaluation-result.json");
  const srcBakDir = join(taskDir, "src.val-bak");

  if (!existsSync(evalFile)) {
    console.log(`  ⚠️  No evaluation found, skipping`);
    throw new Error("No evaluation");
  }

  const evalData = JSON.parse(readFileSync(evalFile, "utf-8"));

  if (!evalData.passed) {
    console.log(`  ⏭️  Task originally failed, skipping validation`);
    throw new Error("Originally failed");
  }

  console.log(`  🔄 Running ${runs} validation attempts...`);

  let failures = 0;
  let consistent = true;

  // Backup original src
  const srcDir = join(taskDir, "src");
  if (existsSync(srcDir)) {
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

  for (let i = 0; i < runs; i++) {
    try {
      const result = await $`cd ${taskDir} && bun test`.nothrow();

      if (result.exitCode !== 0) {
        failures++;
        consistent = false;
        console.log(`  ❌ Run ${i + 1}/${runs} FAILED`);
      } else {
        console.log(`  ✅ Run ${i + 1}/${runs} PASSED`);
      }

      // Restore original src before next run
      if (existsSync(srcBakDir)) {
        rmSync(srcDir, { recursive: true, force: true });
        mkdirSync(srcDir, { recursive: true });
        readdirSync(srcBakDir).forEach(file => {
          const src = join(srcBakDir, file);
          const dest = join(srcDir, file);
          copyFileSync(src, dest);
        });
      }
    } catch (error) {
      failures++;
      consistent = false;
      console.log(`  ❌ Run ${i + 1}/${runs} ERROR: ${error}`);
    }
  }

  // Cleanup
  if (existsSync(srcBakDir)) {
    rmSync(srcBakDir, { recursive: true, force: true });
  }

  return {
    taskName,
    originalPassed: evalData.passed,
    validated: failures === 0,
    attempts: runs,
    failures,
    consistent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main validation
 */
async function main() {
  const args = process.argv.slice(2);
  let tasksToValidate: string[] = [];
  const validationRuns = 3;

  if (args.length === 0 || args[0] === "all") {
    tasksToValidate = readdirSync(tasksDir)
      .filter(d => d.startsWith("task-"))
      .sort();
  } else {
    tasksToValidate = args;
  }

  console.log(`${"=".repeat(60)}`);
  console.log(`BUN BENCHMARK - VALIDATION`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Tasks to validate: ${tasksToValidate.length}`);
  console.log(`Validation runs per task: ${validationRuns}\n`);

  const results: ValidationResult[] = [];
  let validated = 0;
  let inconsistent = 0;
  let skipped = 0;

  for (const taskName of tasksToValidate) {
    console.log(`[${results.length + 1}/${tasksToValidate.length}] ${taskName}`);

    try {
      const result = await validateTask(taskName, validationRuns);
      results.push(result);

      if (result.validated) {
        validated++;
        console.log(`  ✅ VALIDATED (consistent across ${validationRuns} runs)\n`);
      } else {
        inconsistent++;
        console.log(`  ⚠️  INCONSISTENT (${result.failures}/${validationRuns} runs failed)\n`);
      }
    } catch (error) {
      skipped++;
      console.log();
    }
  }

  // Save validation results
  const validationFile = join(import.meta.dir, "..", "validation-results.json");
  writeFileSync(validationFile, JSON.stringify(results, null, 2), "utf-8");

  console.log(`${"=".repeat(60)}`);
  console.log(`VALIDATION SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Validated:     ${validated} ✅`);
  console.log(`Inconsistent:  ${inconsistent} ⚠️`);
  console.log(`Skipped:        ${skipped} ⏭️`);
  console.log(`Consistency:    ${validated + inconsistent > 0 ? ((validated / (validated + inconsistent)) * 100).toFixed(1) : 0}%`);
  console.log(`\nResults saved to: ${validationFile}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
