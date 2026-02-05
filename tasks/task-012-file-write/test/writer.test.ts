import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { saveData, saveDataWithCount, saveAndVerify, saveMultiple, appendData } from "../src/writer";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";

describe("saveData", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-012-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should write data to file", async () => {
    const filePath = join(tempDir, "test1.txt");
    const data = "Hello, World!";

    await saveData(filePath, data);

    // This test will FAIL because the write hasn't completed
    const file = Bun.file(filePath);
    const content = await file.text();

    expect(content).toBe(data);
  });

  test("should create file that exists after save", async () => {
    const filePath = join(tempDir, "test2.txt");

    await saveData(filePath, "test data");

    // This test may FAIL - file might not exist yet
    const file = Bun.file(filePath);
    const exists = await file.exists();

    expect(exists).toBe(true);
  });

  test("should overwrite existing file", async () => {
    const filePath = join(tempDir, "test3.txt");

    // First write (properly awaited for setup)
    await Bun.write(filePath, "original content");

    // Second write using our buggy function
    await saveData(filePath, "new content");

    // This test will FAIL - file still has original content
    const content = await Bun.file(filePath).text();
    expect(content).toBe("new content");
  });
});

describe("saveDataWithCount", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-012-count-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return correct byte count for ASCII", async () => {
    const filePath = join(tempDir, "count1.txt");
    const data = "Hello!"; // 6 bytes = 6 chars for ASCII

    const bytesWritten = await saveDataWithCount(filePath, data);

    // This might pass by accident for ASCII (length == bytes)
    expect(bytesWritten).toBe(6);
  });

  test("should return correct byte count for unicode", async () => {
    const filePath = join(tempDir, "count2.txt");
    // "Hello" in Japanese: こんにちは
    // 5 characters but 15 bytes in UTF-8 (each char is 3 bytes)
    const data = "こんにちは";

    const bytesWritten = await saveDataWithCount(filePath, data);

    // This test will FAIL - buggy code returns string length (5), not byte count (15)
    expect(bytesWritten).toBe(15);
  });

  test("should return correct byte count for emoji", async () => {
    const filePath = join(tempDir, "count3.txt");
    // Emoji: 🎉 is 1 character but 4 bytes in UTF-8
    const data = "🎉";

    const bytesWritten = await saveDataWithCount(filePath, data);

    // This test will FAIL - buggy code returns 2 (surrogate pair length), not 4 bytes
    expect(bytesWritten).toBe(4);
  });

  test("should verify file was actually written", async () => {
    const filePath = join(tempDir, "count4.txt");
    const data = "Test data";

    const bytesWritten = await saveDataWithCount(filePath, data);

    // This test might FAIL due to race condition - file may not be written yet
    const file = Bun.file(filePath);
    const actualSize = file.size;

    expect(bytesWritten).toBe(actualSize);
  });
});

describe("saveAndVerify", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-012-verify-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return the written data", async () => {
    const filePath = join(tempDir, "verify1.txt");
    const data = "Verification test data";

    const result = await saveAndVerify(filePath, data);

    // This test will FAIL - read happens before write completes
    expect(result).toBe(data);
  });

  test("should verify written content matches input", async () => {
    const filePath = join(tempDir, "verify2.txt");
    const data = "Another test";

    const result = await saveAndVerify(filePath, data);

    // This test will FAIL
    expect(result.length).toBe(data.length);
  });
});

describe("saveMultiple", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-012-multi-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should write all files", async () => {
    const entries: [string, string][] = [
      [join(tempDir, "multi1.txt"), "Content 1"],
      [join(tempDir, "multi2.txt"), "Content 2"],
      [join(tempDir, "multi3.txt"), "Content 3"],
    ];

    await saveMultiple(entries);

    // These tests will FAIL - writes haven't completed
    for (const [path, expectedContent] of entries) {
      const content = await Bun.file(path).text();
      expect(content).toBe(expectedContent);
    }
  });
});

describe("appendData", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-012-append-"));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should append data to existing file", async () => {
    const filePath = join(tempDir, "append1.txt");

    // Create initial file
    await Bun.write(filePath, "Hello");

    // Append to it
    await appendData(filePath, " World");

    // This test will FAIL - append write not awaited
    const content = await Bun.file(filePath).text();
    expect(content).toBe("Hello World");
  });

  test("should handle multiple appends", async () => {
    const filePath = join(tempDir, "append2.txt");

    await Bun.write(filePath, "A");
    await appendData(filePath, "B");
    await appendData(filePath, "C");

    // This test will FAIL - race conditions between appends
    const content = await Bun.file(filePath).text();
    expect(content).toBe("ABC");
  });
});
