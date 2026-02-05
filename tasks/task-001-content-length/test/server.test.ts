import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("Content-Length should match byte length for UTF-8", async () => {
  const res = await fetch("http://localhost:3001/");
  const contentLength = res.headers.get("Content-Length");
  const body = await res.text();
  const actualBytes = Buffer.byteLength(body, "utf-8");

  // This test FAILS because buggy code returns 5 (char count) instead of 15 (byte count)
  expect(Number(contentLength)).toBe(actualBytes);
});

test("Response body should be correctly received", async () => {
  const res = await fetch("http://localhost:3001/");
  const body = await res.text();

  expect(body).toBe("こんにちは");
});

test("Content-Length header should be present", async () => {
  const res = await fetch("http://localhost:3001/");
  const contentLength = res.headers.get("Content-Length");

  expect(contentLength).not.toBeNull();
});
