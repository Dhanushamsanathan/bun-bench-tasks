import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists } from "fs/promises";
import { buildServer, getBundleContent, getOutputDirectory } from "../src/build";

const distDir = join(import.meta.dir, "..", "dist");

describe("Bun.build() Target Configuration", () => {
  beforeAll(async () => {
    // Clean up dist directory before tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up after tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
  });

  test("should build successfully", async () => {
    const result = await buildServer();
    expect(result.success).toBe(true);
  });

  test("should have correct target set to bun", async () => {
    // This will fail because target is "node" not "bun"
    const result = await buildServer();
    expect(result.target).toBe("bun");
  });

  test("bundle should preserve Bun.file API calls", async () => {
    const content = await getBundleContent();

    // When target is "bun", Bun.file should be preserved
    // When target is "node", it may be transformed or cause issues
    const hasBunFile = content.includes("Bun.file");

    // This test verifies Bun-specific APIs are preserved
    expect(hasBunFile).toBe(true);
  });

  test("bundle should preserve Bun.serve API calls", async () => {
    const content = await getBundleContent();

    // Bun.serve should be preserved for "bun" target
    const hasBunServe = content.includes("Bun.serve");

    expect(hasBunServe).toBe(true);
  });

  test("bundle should preserve Bun.version reference", async () => {
    const content = await getBundleContent();

    // Bun.version should be preserved for "bun" target
    const hasBunVersion = content.includes("Bun.version");

    expect(hasBunVersion).toBe(true);
  });

  test("bundle should preserve Bun.password API", async () => {
    const content = await getBundleContent();

    // Bun.password should be preserved for "bun" target
    const hasBunPassword = content.includes("Bun.password");

    expect(hasBunPassword).toBe(true);
  });

  test("bundle should be executable with Bun runtime", async () => {
    const result = await buildServer();
    expect(result.success).toBe(true);

    if (result.outputs.length > 0) {
      const outputPath = result.outputs[0];

      // Try to import the bundled module
      // This will fail if Bun APIs are not properly preserved
      try {
        const bundledModule = await import(outputPath);

        // Verify the markers that indicate Bun APIs are available
        expect(bundledModule.BUN_FILE_MARKER).toBe(true);
        expect(bundledModule.BUN_SERVE_MARKER).toBe(true);
        expect(bundledModule.BUN_VERSION_MARKER).toBe(true);
      } catch (error) {
        // If import fails, the test should fail
        expect(error).toBeUndefined();
      }
    }
  });

  test("bundled readConfigFile should work with Bun.file", async () => {
    const result = await buildServer();

    if (result.outputs.length > 0) {
      const outputPath = result.outputs[0];

      try {
        const bundledModule = await import(outputPath);

        // This should work if target is "bun"
        // May throw if target is "node" and Bun.file is not available
        const config = await bundledModule.readConfigFile("/nonexistent/path");
        expect(config).toHaveProperty("error");
      } catch (error: any) {
        // This will fail if Bun APIs are not available
        expect(error.message).not.toContain("Bun is not defined");
      }
    }
  });
});
