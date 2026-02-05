import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  fileExists,
  getFileInfo,
  isReadable,
  readWithDefault,
  checkMultiple,
  waitForFile,
} from "../src/checker";
import { join } from "path";
import { mkdtemp, rm, chmod } from "fs/promises";
import { tmpdir } from "os";

describe("fileExists", () => {
  let tempDir: string;
  let existingFile: string;
  let largeFile: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-"));
    existingFile = join(tempDir, "existing.txt");
    largeFile = join(tempDir, "large.txt");

    await Bun.write(existingFile, "Hello, World!");
    // Create a larger file to demonstrate inefficiency
    await Bun.write(largeFile, "x".repeat(1000000)); // 1MB file
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return true for existing file", async () => {
    const exists = await fileExists(existingFile);

    // This might pass, but is inefficient
    expect(exists).toBe(true);
  });

  test("should return false for non-existent file", async () => {
    const exists = await fileExists(join(tempDir, "nonexistent.txt"));

    // This might pass, but for the wrong reason (catches error)
    expect(exists).toBe(false);
  });

  test("should be efficient for large files", async () => {
    const startTime = Date.now();
    await fileExists(largeFile);
    const duration = Date.now() - startTime;

    // This test will FAIL - reading 1MB is not efficient
    // A proper exists() check should be nearly instant
    expect(duration).toBeLessThan(5); // Should be instant
  });

  test("should handle empty files correctly", async () => {
    const emptyFile = join(tempDir, "empty.txt");
    await Bun.write(emptyFile, "");

    const exists = await fileExists(emptyFile);

    // This should pass
    expect(exists).toBe(true);
  });
});

describe("getFileInfo", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-info-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return correct file size in bytes", async () => {
    const testFile = join(tempDir, "test.txt");
    // Write exactly 13 bytes: "Hello, World!"
    await Bun.write(testFile, "Hello, World!");

    const info = await getFileInfo(testFile);

    // This test will FAIL - size is string length, not always same as byte length
    expect(info?.size).toBe(13);
  });

  test("should return correct size for unicode content", async () => {
    const unicodeFile = join(tempDir, "unicode.txt");
    // "Hello" in Japanese: こんにちは (5 chars, but more bytes in UTF-8)
    await Bun.write(unicodeFile, "こんにちは");

    const info = await getFileInfo(unicodeFile);

    // This test will FAIL - string.length != byte size for unicode
    // Each character is 3 bytes in UTF-8, so 15 bytes total
    expect(info?.size).toBe(15);
  });

  test("should return null for non-existent file", async () => {
    const info = await getFileInfo(join(tempDir, "nonexistent.txt"));

    expect(info).toBeNull();
  });
});

describe("isReadable", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-readable-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return true for readable file", async () => {
    const readableFile = join(tempDir, "readable.txt");
    await Bun.write(readableFile, "readable content");

    const readable = await isReadable(readableFile);

    expect(readable).toBe(true);
  });

  test("should distinguish between not existing and not readable", async () => {
    const notExistsResult = await isReadable(join(tempDir, "doesnt_exist.txt"));

    // The function should ideally tell us WHY it's not readable
    // Current bug: both return false with no distinction
    expect(notExistsResult).toBe(false);
  });

  // Note: Testing unreadable files requires platform-specific permissions
  // which may not work in all environments
});

describe("readWithDefault", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-default-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return file content when file exists", async () => {
    const testFile = join(tempDir, "config.txt");
    await Bun.write(testFile, "actual config");

    const content = await readWithDefault(testFile, "default config");

    expect(content).toBe("actual config");
  });

  test("should return default when file does not exist", async () => {
    const content = await readWithDefault(
      join(tempDir, "missing.txt"),
      "default value"
    );

    expect(content).toBe("default value");
  });

  test("should not return default for I/O errors", async () => {
    // This test documents the bug - we can't distinguish error types
    // In the buggy implementation, ANY error returns default
    // Ideally, only "file not found" should return default
    const content = await readWithDefault(join(tempDir, "missing.txt"), "default");
    expect(content).toBe("default");
  });
});

describe("checkMultiple", () => {
  let tempDir: string;
  let file1: string;
  let file2: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-multi-"));
    file1 = join(tempDir, "file1.txt");
    file2 = join(tempDir, "file2.txt");
    await Bun.write(file1, "content 1");
    await Bun.write(file2, "content 2");
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should check multiple files correctly", async () => {
    const results = await checkMultiple([
      file1,
      file2,
      join(tempDir, "missing.txt"),
    ]);

    expect(results[file1]).toBe(true);
    expect(results[file2]).toBe(true);
    expect(results[join(tempDir, "missing.txt")]).toBe(false);
  });

  test("should be efficient for many files", async () => {
    // Create 10 test files
    const files: string[] = [];
    for (let i = 0; i < 10; i++) {
      const path = join(tempDir, `perf-test-${i}.txt`);
      await Bun.write(path, `content ${i}`);
      files.push(path);
    }

    const startTime = Date.now();
    await checkMultiple(files);
    const duration = Date.now() - startTime;

    // This test documents that sequential checking is slow
    // A parallel implementation would be faster
    expect(duration).toBeLessThan(100);
  });
});

describe("waitForFile", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-015-wait-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return true immediately if file exists", async () => {
    const existingFile = join(tempDir, "already-exists.txt");
    await Bun.write(existingFile, "content");

    const startTime = Date.now();
    const result = await waitForFile(existingFile, 1000, 50);
    const duration = Date.now() - startTime;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  test("should return false after timeout for missing file", async () => {
    const missingFile = join(tempDir, "will-never-exist.txt");

    const startTime = Date.now();
    const result = await waitForFile(missingFile, 500, 100);
    const duration = Date.now() - startTime;

    expect(result).toBe(false);
    expect(duration).toBeGreaterThanOrEqual(500);
  });

  test("should detect file when it appears", async () => {
    const delayedFile = join(tempDir, "delayed.txt");

    // Start waiting for file in background
    const waitPromise = waitForFile(delayedFile, 2000, 50);

    // Create file after a short delay
    await new Promise(resolve => setTimeout(resolve, 100));
    await Bun.write(delayedFile, "appeared!");

    const result = await waitPromise;

    expect(result).toBe(true);
  });
});
