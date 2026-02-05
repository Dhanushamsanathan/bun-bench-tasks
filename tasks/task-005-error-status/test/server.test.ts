import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("GET /api/crash should return 500 status code", async () => {
  const res = await fetch("http://localhost:3005/api/crash");

  // This test FAILS because buggy code returns 200 instead of 500
  expect(res.status).toBe(500);
});

test("GET /api/crash should return error message in body", async () => {
  const res = await fetch("http://localhost:3005/api/crash");
  const data = await res.json();

  expect(data.error).toBe("Something went terribly wrong!");
});

test("GET /api/divide with invalid params should return 400", async () => {
  const res = await fetch("http://localhost:3005/api/divide?a=abc&b=5");

  // This test FAILS - returns 200 instead of 400 Bad Request
  expect(res.status).toBe(400);
});

test("GET /api/divide by zero should return 400", async () => {
  const res = await fetch("http://localhost:3005/api/divide?a=10&b=0");

  // This test FAILS - returns 200 instead of 400
  expect(res.status).toBe(400);
});

test("GET /api/divide with valid params should return 200", async () => {
  const res = await fetch("http://localhost:3005/api/divide?a=10&b=2");
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.result).toBe(5);
});

test("POST /api/process without data field should return 400", async () => {
  const res = await fetch("http://localhost:3005/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notData: "test" }),
  });

  // This test FAILS - returns 200 instead of 400
  expect(res.status).toBe(400);
});

test("POST /api/process with data field should return 200", async () => {
  const res = await fetch("http://localhost:3005/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: "hello" }),
  });
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.processed).toBe("HELLO");
});

test("GET /api/db-error should return 500", async () => {
  const res = await fetch("http://localhost:3005/api/db-error");

  // This test FAILS - returns 200 instead of 500
  expect(res.status).toBe(500);
});

test("Error responses should not have 2xx status codes", async () => {
  const crashRes = await fetch("http://localhost:3005/api/crash");
  const dbErrorRes = await fetch("http://localhost:3005/api/db-error");
  const divideRes = await fetch("http://localhost:3005/api/divide?a=1&b=0");

  // All these FAIL because they all return 200
  expect(crashRes.status).toBeGreaterThanOrEqual(400);
  expect(dbErrorRes.status).toBeGreaterThanOrEqual(400);
  expect(divideRes.status).toBeGreaterThanOrEqual(400);
});
