import { expect, test, describe } from "bun:test";
import { createDataStream, readAllData } from "../src/stream";

describe("ReadableStream cleanup", () => {
  test("stream should complete and return all data", async () => {
    const chunks = ["chunk1", "chunk2", "chunk3"];
    const stream = createDataStream(chunks);

    // This test FAILS because the stream never closes
    // The promise returned by readAllData will hang forever
    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error("Stream read timed out - stream not closed")), 1000);
    });

    const result = await Promise.race([readAllData(stream), timeoutPromise]);

    expect(result).toEqual(chunks);
  });

  test("stream should be fully consumed", async () => {
    const chunks = ["a", "b", "c", "d", "e"];
    const stream = createDataStream(chunks);

    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error("Stream read timed out")), 1000);
    });

    const result = await Promise.race([readAllData(stream), timeoutPromise]);

    expect(result.length).toBe(5);
  });

  test("empty stream should close immediately", async () => {
    const stream = createDataStream([]);

    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error("Empty stream should close immediately")), 500);
    });

    const result = await Promise.race([readAllData(stream), timeoutPromise]);

    expect(result).toEqual([]);
  });

  test("stream reader should release lock after reading", async () => {
    const chunks = ["test"];
    const stream = createDataStream(chunks);

    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error("Stream read timed out")), 1000);
    });

    await Promise.race([readAllData(stream), timeoutPromise]);

    // After reading, the stream should not be locked
    expect(stream.locked).toBe(false);
  });
});
