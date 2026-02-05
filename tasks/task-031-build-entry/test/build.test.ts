import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists } from "fs/promises";
import { buildProject } from "../src/build";

const distDir = join(import.meta.dir, "..", "dist");

describe("Bun.build() Entry Points", () => {
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
    const result = await buildProject();
    expect(result.success).toBe(true);
  });

  test("should generate main.js output", async () => {
    const result = await buildProject();
    const mainOutput = result.outputs.find((p: string) => p.includes("main"));
    expect(mainOutput).toBeDefined();
  });

  test("should generate worker.js output", async () => {
    // This test will fail because worker.ts is not included in entrypoints
    const result = await buildProject();
    const workerOutput = result.outputs.find((p: string) =>
      p.includes("worker")
    );
    expect(workerOutput).toBeDefined();
  });

  test("should have exactly 2 output files", async () => {
    // This test will fail because only 1 entry point is processed
    const result = await buildProject();
    expect(result.outputs.length).toBe(2);
  });

  test("both output files should exist on disk", async () => {
    await buildProject();

    const mainExists = await exists(join(distDir, "main.js"));
    const workerExists = await exists(join(distDir, "worker.js"));

    expect(mainExists).toBe(true);
    expect(workerExists).toBe(true); // This will fail
  });
});
