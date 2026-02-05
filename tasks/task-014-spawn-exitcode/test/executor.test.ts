import { describe, test, expect } from "bun:test";
import {
  runCommandSafe,
  runCommandOrThrow,
  getExitCode,
  runWithTimeout,
  runSequence,
  runCommandDetailed,
} from "../src/executor";

describe("runCommandSafe", () => {
  test("should return true for successful command", async () => {
    const result = await runCommandSafe(["true"]); // 'true' command always exits 0

    // This might pass by accident since we always return true
    expect(result).toBe(true);
  });

  test("should return false for failing command", async () => {
    const result = await runCommandSafe(["false"]); // 'false' command always exits 1

    // This test will FAIL - we return true even for failed commands!
    expect(result).toBe(false);
  });

  test("should return false for non-existent command", async () => {
    const result = await runCommandSafe(["nonexistent_command_12345"]);

    // This test will FAIL - should return false for command not found
    expect(result).toBe(false);
  });

  test("should detect exit code 2", async () => {
    // sh -c 'exit 2' exits with code 2
    const result = await runCommandSafe(["sh", "-c", "exit 2"]);

    // This test will FAIL
    expect(result).toBe(false);
  });
});

describe("runCommandOrThrow", () => {
  test("should not throw for successful command", async () => {
    // This should not throw
    await expect(runCommandOrThrow(["true"])).resolves.toBeUndefined();
  });

  test("should throw for failing command", async () => {
    // This test will FAIL - the function never throws!
    await expect(runCommandOrThrow(["false"])).rejects.toThrow();
  });

  test("should throw for non-existent command", async () => {
    // This test will FAIL
    await expect(runCommandOrThrow(["nonexistent_command_12345"])).rejects.toThrow();
  });

  test("should throw with meaningful error message", async () => {
    try {
      await runCommandOrThrow(["sh", "-c", "exit 42"]);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // This test will FAIL - no error is thrown
      expect(error).toBeDefined();
    }
  });
});

describe("getExitCode", () => {
  test("should return 0 for successful command", async () => {
    const code = await getExitCode(["true"]);

    // This test will FAIL - exitCode is null before process completes
    expect(code).toBe(0);
  });

  test("should return 1 for failing command", async () => {
    const code = await getExitCode(["false"]);

    // This test will FAIL
    expect(code).toBe(1);
  });

  test("should return correct exit code for custom exit", async () => {
    const code = await getExitCode(["sh", "-c", "exit 42"]);

    // This test will FAIL
    expect(code).toBe(42);
  });

  test("should return number type", async () => {
    const code = await getExitCode(["true"]);

    // This test will FAIL - code is null/undefined
    expect(typeof code).toBe("number");
  });
});

describe("runWithTimeout", () => {
  test("should return true for fast successful command", async () => {
    const result = await runWithTimeout(["true"], 1000);

    expect(result).toBe(true);
  });

  test("should return false for fast failing command", async () => {
    const result = await runWithTimeout(["false"], 1000);

    // This test will FAIL
    expect(result).toBe(false);
  });

  test("should handle command that completes within timeout", async () => {
    const result = await runWithTimeout(["sleep", "0.1"], 1000);

    // This might pass by accident
    expect(result).toBe(true);
  });
});

describe("runSequence", () => {
  test("should return true when all commands succeed", async () => {
    const result = await runSequence([["true"], ["true"], ["true"]]);

    // This might pass by accident
    expect(result).toBe(true);
  });

  test("should return false when first command fails", async () => {
    const result = await runSequence([["false"], ["true"], ["true"]]);

    // This test will FAIL
    expect(result).toBe(false);
  });

  test("should return false when middle command fails", async () => {
    const result = await runSequence([["true"], ["false"], ["true"]]);

    // This test will FAIL
    expect(result).toBe(false);
  });

  test("should return false when last command fails", async () => {
    const result = await runSequence([["true"], ["true"], ["false"]]);

    // This test will FAIL
    expect(result).toBe(false);
  });
});

describe("runCommandDetailed", () => {
  test("should return success=true for successful command", async () => {
    const result = await runCommandDetailed(["true"]);

    expect(result.success).toBe(true);
  });

  test("should return success=false for failing command", async () => {
    const result = await runCommandDetailed(["false"]);

    // This test will FAIL
    expect(result.success).toBe(false);
  });

  test("should return correct exit code", async () => {
    const result = await runCommandDetailed(["sh", "-c", "exit 5"]);

    // This test will FAIL
    expect(result.exitCode).toBe(5);
  });

  test("should measure actual duration", async () => {
    const result = await runCommandDetailed(["sleep", "0.1"]);

    // This test will FAIL - duration doesn't include actual execution time
    expect(result.duration).toBeGreaterThanOrEqual(100);
  });

  test("should return all fields with correct types", async () => {
    const result = await runCommandDetailed(["true"]);

    expect(typeof result.success).toBe("boolean");
    expect(typeof result.exitCode).toBe("number");
    expect(typeof result.duration).toBe("number");
  });
});
