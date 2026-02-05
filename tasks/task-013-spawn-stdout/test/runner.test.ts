import { describe, test, expect } from "bun:test";
import {
  runCommand,
  runCommandWithStderr,
  runCommandLines,
  hasOutput,
  runMultipleCommands,
} from "../src/runner";

describe("runCommand", () => {
  test("should capture echo output", async () => {
    const output = await runCommand(["echo", "Hello, World!"]);

    // This test will FAIL - output is empty string, not the actual output
    expect(output.trim()).toBe("Hello, World!");
  });

  test("should capture multi-line output", async () => {
    const output = await runCommand(["printf", "line1\\nline2\\nline3"]);

    // This test will FAIL
    expect(output).toContain("line1");
    expect(output).toContain("line2");
    expect(output).toContain("line3");
  });

  test("should capture command output with arguments", async () => {
    const output = await runCommand(["echo", "-n", "no newline"]);

    // This test will FAIL
    expect(output).toBe("no newline");
  });

  test("should capture output from pwd", async () => {
    const output = await runCommand(["pwd"]);

    // This test will FAIL - output is empty
    expect(output.trim().length).toBeGreaterThan(0);
  });

  test("should capture ls output", async () => {
    const output = await runCommand(["ls", "-la"]);

    // This test will FAIL
    expect(output).toContain("total");
  });
});

describe("runCommandWithStderr", () => {
  test("should capture stdout", async () => {
    const { stdout } = await runCommandWithStderr(["echo", "stdout test"]);

    // This test will FAIL
    expect(stdout.trim()).toBe("stdout test");
  });

  test("should capture stderr from failing command", async () => {
    // ls on a non-existent directory writes to stderr
    const { stderr } = await runCommandWithStderr(["ls", "/nonexistent_path_12345"]);

    // This test will FAIL - stderr is empty
    expect(stderr.length).toBeGreaterThan(0);
  });

  test("should capture both stdout and stderr", async () => {
    // Use sh to output to both streams
    const { stdout, stderr } = await runCommandWithStderr([
      "sh",
      "-c",
      "echo stdout; echo stderr >&2",
    ]);

    // These tests will FAIL
    expect(stdout.trim()).toBe("stdout");
    expect(stderr.trim()).toBe("stderr");
  });
});

describe("runCommandLines", () => {
  test("should return array of lines", async () => {
    const lines = await runCommandLines(["printf", "line1\\nline2\\nline3"]);

    // This test will FAIL - the split won't work on a ReadableStream
    expect(Array.isArray(lines)).toBe(true);
    expect(lines).toContain("line1");
  });

  test("should handle single line output", async () => {
    const lines = await runCommandLines(["echo", "single line"]);

    // This test will FAIL
    expect(lines[0]?.trim()).toBe("single line");
  });
});

describe("hasOutput", () => {
  test("should return true for command with output", async () => {
    const result = await hasOutput(["echo", "hello"]);

    // This might accidentally pass because stdout stream exists
    // but it's checking the wrong thing
    expect(result).toBe(true);
  });

  test("should return false for command with no output", async () => {
    // true command produces no output
    const result = await hasOutput(["true"]);

    // This test will FAIL - buggy code returns true because stream exists
    // even though there's no actual output
    expect(result).toBe(false);
  });

  test("should detect actual content, not just stream existence", async () => {
    // printf with empty string produces no output
    const result = await hasOutput(["printf", ""]);

    // This test will FAIL - buggy code returns true even with no output
    expect(result).toBe(false);
  });
});

describe("runMultipleCommands", () => {
  test("should capture output from multiple commands", async () => {
    const outputs = await runMultipleCommands([
      ["echo", "first"],
      ["echo", "second"],
      ["echo", "third"],
    ]);

    // These tests will FAIL - all outputs are empty strings
    expect(outputs[0]?.trim()).toBe("first");
    expect(outputs[1]?.trim()).toBe("second");
    expect(outputs[2]?.trim()).toBe("third");
  });

  test("should return correct number of outputs", async () => {
    const outputs = await runMultipleCommands([
      ["echo", "a"],
      ["echo", "b"],
    ]);

    // This might pass - we do return correct number of (empty) strings
    expect(outputs.length).toBe(2);

    // But this will FAIL
    expect(outputs.every((o) => o.trim().length > 0)).toBe(true);
  });
});
