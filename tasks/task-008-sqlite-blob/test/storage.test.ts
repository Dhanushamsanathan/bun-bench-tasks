import { describe, test, expect, beforeEach } from "bun:test";
import {
  storeFile,
  getFile,
  getFileBuffer,
  getFileHash,
  verifyFileIntegrity,
  fileExists,
  resetStorage,
} from "../src/storage";

describe("BLOB Handling", () => {
  beforeEach(() => {
    resetStorage();
  });

  test("should store and retrieve simple ASCII text correctly", () => {
    const text = "Hello, World!";
    const data = new TextEncoder().encode(text);

    const id = storeFile("hello.txt", data, "text/plain");
    const file = getFile(id);

    expect(file).not.toBeNull();
    // This might pass for simple ASCII but the implementation is still wrong
    expect(file?.name).toBe("hello.txt");
  });

  test("should store and retrieve binary data with exact byte match", () => {
    // Binary data with various byte values including non-UTF8
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0x80, 0x7f, 0x90]);

    const id = storeFile("binary.dat", binaryData, "application/octet-stream");
    const retrieved = getFileBuffer(id);

    // BUG: This test FAILS - retrieved data doesn't match original
    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(binaryData.length);
    expect(Array.from(retrieved!)).toEqual(Array.from(binaryData));
  });

  test("should preserve null bytes in binary data", () => {
    // Data with null bytes - common in binary files
    const dataWithNulls = new Uint8Array([0x48, 0x00, 0x65, 0x00, 0x6c, 0x00, 0x6c, 0x00, 0x6f, 0x00]);

    const id = storeFile("unicode.bin", dataWithNulls, "application/octet-stream");
    const retrieved = getFileBuffer(id);

    // BUG: This test FAILS - null bytes cause string truncation or corruption
    expect(retrieved?.length).toBe(dataWithNulls.length);
  });

  test("should handle high byte values correctly", () => {
    // All possible byte values 0-255
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      allBytes[i] = i;
    }

    const id = storeFile("allbytes.bin", allBytes, "application/octet-stream");
    const retrieved = getFileBuffer(id);

    // BUG: This test FAILS - high bytes (128-255) are corrupted
    expect(retrieved?.length).toBe(256);

    // Check specific problematic bytes
    expect(retrieved?.[0]).toBe(0);
    expect(retrieved?.[127]).toBe(127);
    expect(retrieved?.[128]).toBe(128); // FAILS: Non-ASCII bytes corrupted
    expect(retrieved?.[255]).toBe(255); // FAILS
  });

  test("should maintain file hash integrity", () => {
    const imageData = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    // Calculate original hash
    const originalHasher = new Bun.CryptoHasher("sha256");
    originalHasher.update(imageData);
    const originalHash = originalHasher.digest("hex");

    const id = storeFile("image.png", imageData, "image/png");
    const storedHash = getFileHash(id);

    // BUG: This test FAILS - hash of corrupted data doesn't match original
    expect(storedHash).toBe(originalHash);
  });

  test("should verify file integrity correctly", () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);

    const id = storeFile("test.bin", data, "application/octet-stream");

    // BUG: This test FAILS - size verification fails because
    // toString() produces a different length string
    expect(verifyFileIntegrity(id)).toBe(true);
  });

  test("should correctly check if file exists with same content", () => {
    const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

    storeFile("checksum.bin", data, "application/octet-stream");

    // BUG: This test FAILS - string comparison fails for binary data
    expect(fileExists("checksum.bin", data)).toBe(true);
  });

  test("should handle empty binary data", () => {
    const emptyData = new Uint8Array(0);

    const id = storeFile("empty.bin", emptyData, "application/octet-stream");
    const retrieved = getFileBuffer(id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(0);
  });

  test("should handle large binary files", () => {
    // 1KB of random-ish binary data
    const largeData = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) {
      largeData[i] = (i * 17 + 13) % 256; // Pseudo-random pattern
    }

    const id = storeFile("large.bin", largeData, "application/octet-stream");
    const retrieved = getFileBuffer(id);

    // BUG: This test FAILS - data corruption affects size and content
    expect(retrieved?.length).toBe(1024);

    // Spot check some bytes
    expect(retrieved?.[0]).toBe(largeData[0]);
    expect(retrieved?.[512]).toBe(largeData[512]);
    expect(retrieved?.[1023]).toBe(largeData[1023]);
  });

  test("should correctly store JPEG file header", () => {
    // JPEG file signature and header bytes
    const jpegHeader = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);

    const id = storeFile("photo.jpg", jpegHeader, "image/jpeg");
    const retrieved = getFileBuffer(id);

    // BUG: This test FAILS - 0xFF bytes are problematic in string conversion
    expect(retrieved?.[0]).toBe(0xff);
    expect(retrieved?.[1]).toBe(0xd8);
    expect(retrieved?.[2]).toBe(0xff);
  });

  test("should handle PDF binary content", () => {
    // PDF header and some binary content
    const pdfContent = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, // %PDF-
      0x31, 0x2e, 0x34, 0x0a, // 1.4\n
      0x25, 0xc4, 0xe5, 0xf2, 0xe5, // Binary comment marker
    ]);

    const id = storeFile("document.pdf", pdfContent, "application/pdf");
    const retrieved = getFileBuffer(id);

    // BUG: The high bytes (0xc4, 0xe5, 0xf2) will be corrupted
    expect(Array.from(retrieved!)).toEqual(Array.from(pdfContent));
  });
});
