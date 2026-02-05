import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists, mkdir, stat } from "fs/promises";
import {
  buildForTarget,
  buildForAllTargets,
  getValidTargets,
  isValidTarget,
  getOutputDirectory,
  type TargetPlatform,
} from "../src/build";

const distDir = join(import.meta.dir, "..", "dist");

// Valid Bun target identifiers
const VALID_BUN_TARGETS = [
  "bun-linux-x64",
  "bun-linux-x64-baseline",
  "bun-linux-arm64",
  "bun-darwin-x64",
  "bun-darwin-arm64",
  "bun-windows-x64",
  "bun-windows-x64-baseline",
];

describe("Bun Compile Cross-Platform Targets", () => {
  beforeAll(async () => {
    // Clean up dist directory before tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
    await mkdir(distDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up after tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
  });

  test("should return valid Bun target identifiers", () => {
    const targets = getValidTargets();

    // This will FAIL - returns invalid targets without "bun-" prefix
    for (const target of targets) {
      expect(target.startsWith("bun-")).toBe(true);
    }
  });

  test("should validate correct target format", () => {
    // This will FAIL - isValidTarget uses wrong format
    expect(isValidTarget("bun-linux-x64")).toBe(true);
    expect(isValidTarget("bun-darwin-arm64")).toBe(true);
    expect(isValidTarget("bun-windows-x64")).toBe(true);
  });

  test("should reject invalid target format", () => {
    // These should be invalid
    expect(isValidTarget("linux-x64")).toBe(false);
    expect(isValidTarget("darwin")).toBe(false);
    expect(isValidTarget("windows")).toBe(false);
    expect(isValidTarget("invalid-target")).toBe(false);
  });

  test("should build for Linux target", async () => {
    const result = await buildForTarget("linux");

    // This will FAIL - invalid target identifier used
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("should use correct Linux target identifier", async () => {
    const result = await buildForTarget("linux");

    // The target should be in correct Bun format
    // This will FAIL - uses "linux-x64" instead of "bun-linux-x64"
    expect(result.target).toBe("bun-linux-x64");
  });

  test("should build for macOS target", async () => {
    const result = await buildForTarget("macos");

    // This will FAIL - invalid target identifier used
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("should use correct macOS target identifier", async () => {
    const result = await buildForTarget("macos");

    // The target should be in correct Bun format
    // This will FAIL - uses "darwin-arm64" instead of "bun-darwin-arm64"
    expect(result.target).toBe("bun-darwin-arm64");
  });

  test("should build for Windows target", async () => {
    const result = await buildForTarget("windows");

    // This will FAIL - invalid target identifier used
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("should use correct Windows target identifier", async () => {
    const result = await buildForTarget("windows");

    // The target should be in correct Bun format
    // This will FAIL - uses "windows-x64" instead of "bun-windows-x64"
    expect(result.target).toBe("bun-windows-x64");
  });

  test("should create output files for successful builds", async () => {
    const result = await buildForTarget("linux");

    if (result.success && result.outputPath) {
      const outputExists = await exists(result.outputPath);
      expect(outputExists).toBe(true);
    } else {
      // If build fails, it's because of invalid target
      expect(result.error).toContain("target");
    }
  });

  test("should build for all platforms", async () => {
    const results = await buildForAllTargets();

    // This will FAIL - all builds fail due to invalid targets
    expect(results.linux.success).toBe(true);
    expect(results.macos.success).toBe(true);
    expect(results.windows.success).toBe(true);
  });

  test("should not contain errors in build results", async () => {
    const results = await buildForAllTargets();

    // This will FAIL - builds have errors due to invalid targets
    expect(results.linux.error).toBeUndefined();
    expect(results.macos.error).toBeUndefined();
    expect(results.windows.error).toBeUndefined();
  });

  test("target identifiers should match Bun documentation", () => {
    const targets = getValidTargets();

    // All returned targets should be in the valid list
    // This will FAIL - returned targets are in wrong format
    for (const target of targets) {
      expect(VALID_BUN_TARGETS).toContain(target);
    }
  });

  test("should handle baseline targets for older CPUs", () => {
    // Baseline targets should be recognized as valid
    // This will FAIL - baseline targets not included
    expect(isValidTarget("bun-linux-x64-baseline")).toBe(true);
    expect(isValidTarget("bun-windows-x64-baseline")).toBe(true);
  });
});
