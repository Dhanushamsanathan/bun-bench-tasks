import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { runUserCommand, searchInFile, getFileInfo, copyFile, listFiles } from "../src/runner";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Shell Command Injection Tests", () => {
  let tempDir: string;
  let testFile: string;
  let fileWithSpaces: string;
  let fileWithSpecialChars: string;

  beforeAll(async () => {
    // Create temp directory for tests
    tempDir = await mkdtemp(join(tmpdir(), "shell-test-"));

    // Create test files
    testFile = join(tempDir, "test.txt");
    await Bun.write(testFile, "Hello, World!\nThis is a test file.\n");

    // File with spaces in name
    fileWithSpaces = join(tempDir, "file with spaces.txt");
    await Bun.write(fileWithSpaces, "Content with spaces in filename\n");

    // File with special characters
    fileWithSpecialChars = join(tempDir, "file'with\"special.txt");
    await Bun.write(fileWithSpecialChars, "Special chars content\n");
  });

  afterAll(async () => {
    // Cleanup temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("runUserCommand", () => {
    test("should read a simple file", async () => {
      const result = await runUserCommand(testFile);
      expect(result).toContain("Hello, World!");
    });

    test("should handle files with spaces in name", async () => {
      // BUG: This will fail because spaces aren't escaped
      const result = await runUserCommand(fileWithSpaces);
      expect(result).toBe("Content with spaces in filename\n");
    });

    test("should handle files with quotes in name", async () => {
      // BUG: This will fail due to unescaped quotes
      const result = await runUserCommand(fileWithSpecialChars);
      expect(result).toBe("Special chars content\n");
    });

    test("should not execute injected commands", async () => {
      // BUG: This test exposes the injection vulnerability
      // The malicious filename should NOT execute the echo command
      const maliciousFilename = `${testFile}; echo INJECTED`;

      try {
        const result = await runUserCommand(maliciousFilename);
        // If injection happens, "INJECTED" will be in the output
        expect(result).not.toContain("INJECTED");
      } catch (e) {
        // Should fail safely without executing injected command
        expect(e).toBeDefined();
      }
    });

    test("should reject path traversal attempts", async () => {
      const maliciousPath = `${testFile}; cat /etc/passwd`;

      try {
        const result = await runUserCommand(maliciousPath);
        // Should NOT contain passwd file contents
        expect(result).not.toContain("root:");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe("searchInFile", () => {
    test("should search for simple patterns", async () => {
      const result = await searchInFile(testFile, "Hello");
      expect(result).toContain("Hello");
    });

    test("should handle patterns with special regex chars", async () => {
      // BUG: Pattern with special chars could break or inject
      const result = await searchInFile(testFile, "Hello.*World");
      expect(result).toContain("Hello");
    });

    test("should not allow pattern injection", async () => {
      // BUG: This could execute arbitrary commands
      const maliciousPattern = `"; cat /etc/passwd; echo "`;

      try {
        const result = await searchInFile(testFile, maliciousPattern);
        expect(result).not.toContain("root:");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe("getFileInfo", () => {
    test("should get file info for simple files", async () => {
      const info = await getFileInfo(testFile);
      expect(parseInt(info.size)).toBeGreaterThan(0);
      expect(parseInt(info.lines)).toBeGreaterThan(0);
    });

    test("should handle files with spaces", async () => {
      // BUG: Will fail with unescaped spaces
      const info = await getFileInfo(fileWithSpaces);
      expect(parseInt(info.size)).toBeGreaterThan(0);
    });

    test("should not execute injected commands in filename", async () => {
      const maliciousFile = `${testFile}; echo HACKED > /tmp/pwned`;

      try {
        await getFileInfo(maliciousFile);
        // Check that the injection didn't create the file
        const pwnedExists = await Bun.file("/tmp/pwned").exists();
        expect(pwnedExists).toBe(false);
      } catch (e) {
        // Expected to fail safely
      }
    });
  });

  describe("copyFile", () => {
    test("should copy files safely", async () => {
      const dest = join(tempDir, "copy.txt");
      const result = await copyFile(testFile, dest);
      expect(result).toBe(true);

      const content = await Bun.file(dest).text();
      expect(content).toContain("Hello, World!");
    });

    test("should handle source files with spaces", async () => {
      // BUG: Source with spaces will fail
      const dest = join(tempDir, "copy2.txt");
      const result = await copyFile(fileWithSpaces, dest);
      expect(result).toBe(true);
    });

    test("should handle destination with spaces", async () => {
      // BUG: Destination with spaces will fail
      const dest = join(tempDir, "destination with spaces.txt");
      const result = await copyFile(testFile, dest);
      expect(result).toBe(true);

      const exists = await Bun.file(dest).exists();
      expect(exists).toBe(true);
    });

    test("should prevent injection through destination", async () => {
      // BUG: Injection through destination path
      const maliciousDest = `${tempDir}/safe.txt; touch ${tempDir}/hacked`;

      await copyFile(testFile, maliciousDest);

      // The "hacked" file should NOT be created
      const hackedExists = await Bun.file(join(tempDir, "hacked")).exists();
      expect(hackedExists).toBe(false);
    });
  });

  describe("listFiles", () => {
    test("should list files with simple pattern", async () => {
      const files = await listFiles(join(tempDir, "*.txt"));
      expect(files.length).toBeGreaterThan(0);
    });

    test("should not execute commands in pattern", async () => {
      // BUG: Pattern could inject commands
      const maliciousPattern = `${tempDir}/*.txt; echo PWNED`;

      const result = await listFiles(maliciousPattern);

      // The result should not contain "PWNED"
      expect(result.join("\n")).not.toContain("PWNED");
    });
  });
});
