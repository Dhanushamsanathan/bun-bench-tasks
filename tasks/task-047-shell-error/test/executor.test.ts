import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  fileExists,
  directoryExists,
  runCommand,
  findFiles,
  getExitCode,
  commandExists,
  runWithTimeout,
  grepFile,
  compareFiles,
  validateJson,
} from "../src/executor";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Shell Error Handling Tests", () => {
  let tempDir: string;
  let existingFile: string;
  let existingDir: string;
  let jsonFile: string;
  let invalidJsonFile: string;

  beforeAll(async () => {
    // Create temp directory and files for tests
    tempDir = await mkdtemp(join(tmpdir(), "shell-error-test-"));
    existingFile = join(tempDir, "exists.txt");
    existingDir = join(tempDir, "subdir");
    jsonFile = join(tempDir, "valid.json");
    invalidJsonFile = join(tempDir, "invalid.json");

    await Bun.write(existingFile, "test content\nline two\nline three\n");
    await Bun.$`mkdir -p ${existingDir}`;
    await Bun.write(jsonFile, '{"key": "value"}');
    await Bun.write(invalidJsonFile, '{invalid json}');
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("fileExists", () => {
    test("should return true for existing file", async () => {
      const result = await fileExists(existingFile);
      expect(result).toBe(true);
    });

    test("should return false for non-existing file without throwing", async () => {
      // BUG: This throws instead of returning false
      const result = await fileExists("/nonexistent/file/path.txt");
      expect(result).toBe(false);
    });

    test("should handle permission denied gracefully", async () => {
      // BUG: Permission errors throw instead of returning false
      const result = await fileExists("/etc/shadow");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("directoryExists", () => {
    test("should return true for existing directory", async () => {
      const result = await directoryExists(existingDir);
      expect(result).toBe(true);
    });

    test("should return false for non-existing directory without throwing", async () => {
      // BUG: Throws instead of returning false
      const result = await directoryExists("/nonexistent/directory");
      expect(result).toBe(false);
    });

    test("should return false when path is a file not directory", async () => {
      // BUG: Throws because test -d returns 1 for files
      const result = await directoryExists(existingFile);
      expect(result).toBe(false);
    });
  });

  describe("runCommand", () => {
    test("should run successful command", async () => {
      const result = await runCommand("echo hello");
      expect(result.success).toBe(true);
      expect(result.output.trim()).toBe("hello");
      expect(result.exitCode).toBe(0);
    });

    test("should handle failing command without throwing", async () => {
      // BUG: This throws instead of returning error info
      const result = await runCommand("false");
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    test("should capture stderr on failure", async () => {
      // BUG: Can't capture stderr because it throws
      const result = await runCommand("ls /nonexistent/path");
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("findFiles", () => {
    test("should find matching files", async () => {
      const files = await findFiles(tempDir, "*.txt");
      expect(files.length).toBeGreaterThan(0);
    });

    test("should return empty array when no matches without throwing", async () => {
      // BUG: May throw when find returns no results
      const files = await findFiles(tempDir, "*.nonexistent");
      expect(Array.isArray(files)).toBe(true);
    });

    test("should handle non-existent directory gracefully", async () => {
      // BUG: Throws because find fails on non-existent directory
      const files = await findFiles("/nonexistent/dir", "*");
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe("getExitCode", () => {
    test("should get exit code 0 for successful command", async () => {
      const code = await getExitCode("true");
      expect(code).toBe(0);
    });

    test("should get exit code 1 for failing command without throwing", async () => {
      // BUG: Throws instead of returning 1
      const code = await getExitCode("false");
      expect(code).toBe(1);
    });

    test("should get specific exit codes", async () => {
      // BUG: Throws instead of returning the exit code
      const code = await getExitCode("exit 42");
      expect(code).toBe(42);
    });
  });

  describe("commandExists", () => {
    test("should return true for existing command", async () => {
      const result = await commandExists("ls");
      expect(result).toBe(true);
    });

    test("should return false for non-existing command without throwing", async () => {
      // BUG: Throws because which returns 1 for missing commands
      const result = await commandExists("nonexistentcommand12345");
      expect(result).toBe(false);
    });
  });

  describe("runWithTimeout", () => {
    test("should complete fast command within timeout", async () => {
      const result = await runWithTimeout("echo fast", 5);
      expect(result.success).toBe(true);
      expect(result.output.trim()).toBe("fast");
    });

    test("should handle timeout gracefully", async () => {
      // BUG: Throws with exit code 124 on timeout
      const result = await runWithTimeout("sleep 10", 1);
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(124); // timeout exit code
    });
  });

  describe("grepFile", () => {
    test("should find matching pattern", async () => {
      const result = await grepFile(existingFile, "test");
      expect(result.found).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
    });

    test("should handle no matches without throwing", async () => {
      // BUG: Throws because grep returns 1 when no matches
      const result = await grepFile(existingFile, "nonexistentpattern");
      expect(result.found).toBe(false);
      expect(result.matches).toEqual([]);
    });

    test("should handle non-existent file gracefully", async () => {
      // BUG: Throws because grep fails on missing file
      const result = await grepFile("/nonexistent/file.txt", "pattern");
      expect(result.found).toBe(false);
    });
  });

  describe("compareFiles", () => {
    test("should report identical files", async () => {
      const copy = join(tempDir, "copy.txt");
      await Bun.write(copy, "test content\nline two\nline three\n");

      const result = await compareFiles(existingFile, copy);
      expect(result.identical).toBe(true);
    });

    test("should report different files without throwing", async () => {
      const different = join(tempDir, "different.txt");
      await Bun.write(different, "completely different content\n");

      // BUG: Throws because diff returns 1 when files differ
      const result = await compareFiles(existingFile, different);
      expect(result.identical).toBe(false);
      expect(result.diff).toBeTruthy();
    });

    test("should handle missing file gracefully", async () => {
      // BUG: Throws because diff fails on missing file
      const result = await compareFiles(existingFile, "/nonexistent/file.txt");
      expect(result.identical).toBe(false);
    });
  });

  describe("validateJson", () => {
    test("should validate correct JSON", async () => {
      const result = await validateJson(jsonFile);
      expect(result.valid).toBe(true);
    });

    test("should handle invalid JSON without throwing", async () => {
      // BUG: Throws because jq returns non-zero for invalid JSON
      const result = await validateJson(invalidJsonFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test("should handle missing file gracefully", async () => {
      // BUG: Throws because jq fails on missing file
      const result = await validateJson("/nonexistent/file.json");
      expect(result.valid).toBe(false);
    });
  });
});
