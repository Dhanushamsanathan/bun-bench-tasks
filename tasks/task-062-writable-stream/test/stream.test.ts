import { expect, test, describe } from "bun:test";
import { createCollectorStream, writeDataBuggy } from "../src/stream";

describe("WritableStream backpressure handling", () => {
  test("all data chunks should be written when function returns", async () => {
    const { stream, getResult } = createCollectorStream();
    const testData = ["chunk1", "chunk2", "chunk3", "chunk4", "chunk5"];

    await writeDataBuggy(stream, testData);

    // Check immediately after function returns
    const result = getResult();

    // This test FAILS because writes are not awaited
    // The function returns before data is written
    expect(result.chunks).toEqual(testData);
  });

  test("stream should be closed when function returns", async () => {
    const { stream, getResult } = createCollectorStream();
    const testData = ["hello", "world"];

    await writeDataBuggy(stream, testData);

    const result = getResult();

    // This test FAILS because stream.close() was called but not awaited
    expect(result.closed).toBe(true);
  });

  test("data should be written in order", async () => {
    const { stream, getResult } = createCollectorStream();
    const testData = Array.from({ length: 10 }, (_, i) => `item-${i}`);

    await writeDataBuggy(stream, testData);

    const result = getResult();

    // This test FAILS because data isn't fully written when returning
    expect(result.chunks).toEqual(testData);
  });

  test("total bytes should match input when function returns", async () => {
    const { stream, getResult } = createCollectorStream();
    const testData = ["hello", "world", "test"];
    const expectedBytes = testData.reduce((sum, s) => sum + s.length, 0);

    await writeDataBuggy(stream, testData);

    const result = getResult();

    // This test FAILS because some writes may not be complete
    expect(result.totalBytes).toBe(expectedBytes);
  });

  test("large data set should be fully written", async () => {
    const { stream, getResult } = createCollectorStream();
    const testData = Array.from({ length: 20 }, (_, i) => `data-block-${i}`);

    await writeDataBuggy(stream, testData);

    const result = getResult();

    // This test FAILS with larger data sets due to async timing issues
    expect(result.chunks.length).toBe(20);
  });

  test("empty data should work correctly", async () => {
    const { stream, getResult } = createCollectorStream();

    await writeDataBuggy(stream, []);

    // Give a tiny bit of time for empty close to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = getResult();

    expect(result.chunks).toEqual([]);
    expect(result.totalBytes).toBe(0);
  });
});
