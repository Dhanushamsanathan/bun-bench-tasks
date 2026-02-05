import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists, mkdir } from "fs/promises";
import { buildExecutable, compileWithCLI, getOutputDirectory } from "../src/build";

const distDir = join(import.meta.dir, "..", "dist");
const srcDir = join(import.meta.dir, "..", "src");

describe("Bun Compile with Embedded Assets", () => {
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

  test("should build successfully", async () => {
    const result = await buildExecutable();
    expect(result.success).toBe(true);
  });

  test("should create output file", async () => {
    const result = await buildExecutable();
    expect(result.outputPath).toBeDefined();

    if (result.outputPath) {
      const outputExists = await exists(result.outputPath);
      expect(outputExists).toBe(true);
    }
  });

  test("assets should be embedded in executable", async () => {
    const result = await buildExecutable();

    // This will FAIL because assets are not properly embedded
    expect(result.assetsEmbedded).toBe(true);
  });

  test("compiled executable should load config asset", async () => {
    const result = await compileWithCLI();

    if (!result.success || !result.outputPath) {
      expect(result.success).toBe(true);
      return;
    }

    // Run the compiled executable and check if it can access the config
    const proc = Bun.spawn([result.outputPath], {
      stdout: "pipe",
      stderr: "pipe",
      // Run from a different directory to ensure embedded assets work
      cwd: "/tmp",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    // This will FAIL - config won't load because assets aren't embedded
    expect(stderr).not.toContain("Failed to load config");
    expect(stdout).toContain("MyEmbeddedApp");
  });

  test("compiled executable should load template asset", async () => {
    const result = await compileWithCLI();

    if (!result.success || !result.outputPath) {
      expect(result.success).toBe(true);
      return;
    }

    const proc = Bun.spawn([result.outputPath], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: "/tmp",
    });

    await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    // This will FAIL - template won't load because assets aren't embedded
    expect(stderr).not.toContain("Failed to load template");
    expect(stdout).toContain("Welcome to");
  });

  test("compiled executable should render template with config values", async () => {
    const result = await compileWithCLI();

    if (!result.success || !result.outputPath) {
      expect(result.success).toBe(true);
      return;
    }

    const proc = Bun.spawn([result.outputPath], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: "/tmp",
    });

    await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    // This will FAIL - can't render without both assets
    expect(stdout).toContain("Rendered:");
    expect(stdout).toContain("MyEmbeddedApp");
    expect(stdout).toContain("1.0.0");
  });

  test("executable should work from any directory", async () => {
    const result = await compileWithCLI();

    if (!result.success || !result.outputPath) {
      expect(result.success).toBe(true);
      return;
    }

    // Test running from multiple different directories
    const testDirs = ["/tmp", "/var/tmp", process.env.HOME || "/"];

    for (const testDir of testDirs) {
      if (await exists(testDir)) {
        const proc = Bun.spawn([result.outputPath], {
          stdout: "pipe",
          stderr: "pipe",
          cwd: testDir,
        });

        const exitCode = await proc.exited;
        const stderr = await new Response(proc.stderr).text();

        // This will FAIL - relative paths don't work when running from different directories
        expect(exitCode).toBe(0);
        expect(stderr).toBe("");
      }
    }
  });

  test("asset files should exist in source", async () => {
    // Verify source assets exist before compilation
    const configPath = join(srcDir, "assets", "config.json");
    const templatePath = join(srcDir, "assets", "template.txt");

    expect(await exists(configPath)).toBe(true);
    expect(await exists(templatePath)).toBe(true);
  });
});
