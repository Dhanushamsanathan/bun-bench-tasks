import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists } from "fs/promises";
import {
  buildApp,
  getExpectedOutputPath,
  getActualOutputPath,
  getExpectedDirectory,
} from "../src/build";

const projectRoot = join(import.meta.dir, "..");
const expectedDistDir = join(projectRoot, "dist");
const wrongDistDir = join(projectRoot, "src", "dist");

describe("Bun.build() Output Directory", () => {
  beforeAll(async () => {
    // Clean up both possible dist directories before tests
    if (await exists(expectedDistDir)) {
      await rm(expectedDistDir, { recursive: true });
    }
    if (await exists(wrongDistDir)) {
      await rm(wrongDistDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up after tests
    if (await exists(expectedDistDir)) {
      await rm(expectedDistDir, { recursive: true });
    }
    if (await exists(wrongDistDir)) {
      await rm(wrongDistDir, { recursive: true });
    }
  });

  test("should build successfully", async () => {
    const result = await buildApp();
    expect(result.success).toBe(true);
  });

  test("output should be in expected versioned directory", async () => {
    await buildApp();
    const expectedPath = getExpectedOutputPath();
    const expectedDir = getExpectedDirectory();

    // The expected directory should exist at dist/v1
    const dirExists = await exists(expectedDir);
    // This will FAIL because output goes to src/dist/version-1 instead
    expect(dirExists).toBe(true);
  });

  test("output file should exist at expected path", async () => {
    await buildApp();
    const expectedPath = getExpectedOutputPath();

    // The file should exist at dist/v1/app.js
    const fileExists = await exists(expectedPath);
    // This will FAIL because file is at src/dist/version-1/app.js
    expect(fileExists).toBe(true);
  });

  test("expected path should match actual path", async () => {
    const expectedPath = getExpectedOutputPath();
    const actualPath = getActualOutputPath();

    // The paths should be the same
    // This will FAIL because paths are different
    expect(actualPath).toBe(expectedPath);
  });

  test("output directory should use correct version format", async () => {
    const result = await buildApp();

    // Should use "v1" format, not "version-1"
    const usesCorrectFormat = result.outdir.includes("/v1");
    // This will FAIL because it uses "version-1" instead
    expect(usesCorrectFormat).toBe(true);
  });

  test("output should not be nested in src directory", async () => {
    const result = await buildApp();

    // Output should be at project root dist/, not src/dist/
    const isNestedInSrc = result.outdir.includes("/src/dist");
    // This will FAIL because output IS nested in src/
    expect(isNestedInSrc).toBe(false);
  });

  test("application should be able to load bundle from expected path", async () => {
    await buildApp();
    const expectedPath = getExpectedOutputPath();

    // Try to load the bundle from where the application expects it
    const canLoad = await exists(expectedPath);

    if (canLoad) {
      const bundle = await import(expectedPath);
      expect(bundle).toBeDefined();
    } else {
      // This will FAIL because file is not at expected location
      expect(canLoad).toBe(true);
    }
  });
});
