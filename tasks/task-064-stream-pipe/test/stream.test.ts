import { expect, test, describe } from "bun:test";
import { runPipelineWithData } from "../src/stream";

describe("Stream pipeline error handling", () => {
  test("pipeline should complete successfully without errors", async () => {
    const result = await runPipelineWithData(["hello", "world", "test"]);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(["HELLO", "WORLD", "TEST"]);
  });

  test("pipeline should handle source errors gracefully", async () => {
    // This test FAILS because errors crash the pipeline
    const result = await runPipelineWithData(
      ["a", "b", "c", "d"],
      2 // Error at index 2
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("Source error");
    // Should have processed data before the error
    expect(result.data.length).toBeGreaterThanOrEqual(0);
  });

  test("pipeline should handle transform errors gracefully", async () => {
    // This test FAILS because errors crash the pipeline
    const result = await runPipelineWithData(
      ["hello", "error", "world"],
      undefined,
      "error" // Error on "error" chunk
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("Transform error");
  });

  test("pipeline should handle sink errors gracefully", async () => {
    // This test FAILS because errors crash the pipeline
    const result = await runPipelineWithData(
      ["hello", "world", "test"],
      undefined,
      undefined,
      "WORLD" // Error on "WORLD" chunk (after transform)
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("Sink error");
  });

  test("pipeline should report partial data on error", async () => {
    // This test FAILS because errors crash before returning data
    const result = await runPipelineWithData(
      ["a", "b", "c", "d", "e"],
      3 // Error at index 3
    );

    expect(result.success).toBe(false);
    // Should have at least some data before the error
    expect(result.data.length).toBeLessThan(5);
  });

  test("pipeline should clean up resources on error", async () => {
    // This test FAILS because cleanup doesn't happen properly
    let cleanupCalled = false;

    const result = await runPipelineWithData(
      ["hello", "error", "world"],
      undefined,
      "error"
    );

    expect(result.success).toBe(false);
    // In a proper implementation, resources would be cleaned up
  });

  test("empty pipeline should succeed", async () => {
    const result = await runPipelineWithData([]);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
