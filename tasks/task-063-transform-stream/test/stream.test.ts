import { expect, test, describe } from "bun:test";
import {
  createUppercaseTransform,
  createJsonParseTransform,
  pipeWithTransform,
} from "../src/stream";

describe("TransformStream transformation", () => {
  test("uppercase transform should transform all chunks", async () => {
    const transform = createUppercaseTransform();
    const input = ["hello", "world", "test"];

    const output = await pipeWithTransform(input, transform);

    // This test FAILS because transform doesn't enqueue data
    expect(output).toEqual(["HELLO", "WORLD", "TEST"]);
  });

  test("transform should preserve chunk count", async () => {
    const transform = createUppercaseTransform();
    const input = ["a", "b", "c", "d", "e"];

    const output = await pipeWithTransform(input, transform);

    // This test FAILS because no chunks are passed through
    expect(output.length).toBe(5);
  });

  test("transform should handle empty input", async () => {
    const transform = createUppercaseTransform();
    const input: string[] = [];

    const output = await pipeWithTransform(input, transform);

    expect(output).toEqual([]);
  });

  test("transform should handle single chunk", async () => {
    const transform = createUppercaseTransform();
    const input = ["single"];

    const output = await pipeWithTransform(input, transform);

    // This test FAILS because the chunk is lost
    expect(output).toEqual(["SINGLE"]);
  });

  test("json parse transform should parse objects", async () => {
    const transform = createJsonParseTransform();

    const readable = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('{"name":"alice"}\n');
        controller.enqueue('{"name":"bob"}\n');
        controller.close();
      },
    });

    const results: object[] = [];
    const writable = new WritableStream<object>({
      write(chunk) {
        results.push(chunk);
      },
    });

    await readable.pipeThrough(transform).pipeTo(writable);

    // This test FAILS because parsed objects are not enqueued
    expect(results).toEqual([{ name: "alice" }, { name: "bob" }]);
  });

  test("transform should maintain data integrity", async () => {
    const transform = createUppercaseTransform();
    const input = ["Mixed", "CASE", "input"];

    const output = await pipeWithTransform(input, transform);

    // This test FAILS because data doesn't pass through
    expect(output).toEqual(["MIXED", "CASE", "INPUT"]);
  });
});
