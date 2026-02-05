import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { hashFile, hashFileAsBytes, hashMultipleFiles, verifyFileIntegrity, getMemoryUsage } from "../src/hashfile";

const TEST_DIR = "/tmp/hash-stream-test";
const SMALL_FILE = `${TEST_DIR}/small.txt`;
const MEDIUM_FILE = `${TEST_DIR}/medium.txt`;
const BINARY_FILE = `${TEST_DIR}/binary.bin`;

describe("Hash Streaming", () => {
  beforeAll(async () => {
    // Create test directory
    await Bun.$`mkdir -p ${TEST_DIR}`;

    // Create small test file
    await Bun.write(SMALL_FILE, "Hello, World!");

    // Create medium test file (1 MB)
    const mediumContent = "x".repeat(1024 * 1024);
    await Bun.write(MEDIUM_FILE, mediumContent);

    // Create binary file with bytes that aren't valid UTF-8
    // This will cause issues when using text() instead of bytes/stream
    const binaryData = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      binaryData[i] = i; // Includes bytes 128-255 which may not be valid UTF-8
    }
    await Bun.write(BINARY_FILE, binaryData);
  });

  afterAll(async () => {
    // Cleanup test files
    await Bun.$`rm -rf ${TEST_DIR}`;
  });

  test("should hash small file correctly", async () => {
    const hash = await hashFile(SMALL_FILE);

    // SHA256 of "Hello, World!"
    expect(hash).toBe("dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f");
  });

  test("should produce consistent hashes", async () => {
    const hash1 = await hashFile(SMALL_FILE);
    const hash2 = await hashFile(SMALL_FILE);

    expect(hash1).toBe(hash2);
  });

  test("should support different algorithms", async () => {
    const sha256 = await hashFile(SMALL_FILE, "sha256");
    const sha512 = await hashFile(SMALL_FILE, "sha512");
    const md5 = await hashFile(SMALL_FILE, "md5");

    // Different algorithms produce different hash lengths
    expect(sha256.length).toBe(64); // 256 bits = 64 hex chars
    expect(sha512.length).toBe(128); // 512 bits = 128 hex chars
    expect(md5.length).toBe(32); // 128 bits = 32 hex chars
  });

  test("should hash binary file correctly", async () => {
    // Get the correct hash using bytes
    const correctHash = await hashFileAsBytes(BINARY_FILE);

    // This test FAILS because hashFile uses text() which corrupts binary data
    // The text() method interprets bytes as UTF-8, corrupting non-UTF-8 binary data
    const buggyHash = await hashFile(BINARY_FILE);

    expect(buggyHash).toBe(correctHash);
  });

  test("binary file hash should match known value", async () => {
    // Calculate expected hash of bytes 0-255
    const hasher = new Bun.CryptoHasher("sha256");
    const binaryData = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      binaryData[i] = i;
    }
    hasher.update(binaryData);
    const expectedHash = hasher.digest("hex");

    // This test FAILS because hashFile corrupts binary data via text()
    const actualHash = await hashFile(BINARY_FILE);
    expect(actualHash).toBe(expectedHash);
  });

  test("should use streaming for large files (function signature check)", async () => {
    // Read the source code to verify streaming is used
    const sourceCode = await Bun.file(import.meta.dir + "/../src/hashfile.ts").text();

    // This test FAILS because the implementation doesn't use streaming
    // Should use .stream() and getReader() for proper streaming
    const usesStreaming = sourceCode.includes(".stream()") && sourceCode.includes("getReader()");
    expect(usesStreaming).toBe(true);
  });

  test("should not load entire file with text()", async () => {
    // Read the source code to verify text() is not used for file reading
    const sourceCode = await Bun.file(import.meta.dir + "/../src/hashfile.ts").text();

    // Check if hashFile function uses .text() - which it shouldn't for binary safety
    // This test FAILS because the buggy implementation uses .text()
    const usesTextMethod = /\.text\(\)/.test(sourceCode);
    expect(usesTextMethod).toBe(false);
  });

  test("should hash multiple files", async () => {
    const results = await hashMultipleFiles([SMALL_FILE, MEDIUM_FILE]);

    expect(results.size).toBe(2);
    expect(results.has(SMALL_FILE)).toBe(true);
    expect(results.has(MEDIUM_FILE)).toBe(true);
  });

  test("should verify file integrity", async () => {
    const hash = await hashFile(SMALL_FILE);
    const isValid = await verifyFileIntegrity(SMALL_FILE, hash);

    expect(isValid).toBe(true);
  });

  test("should reject wrong hash in integrity check", async () => {
    const wrongHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const isValid = await verifyFileIntegrity(SMALL_FILE, wrongHash);

    expect(isValid).toBe(false);
  });
});
