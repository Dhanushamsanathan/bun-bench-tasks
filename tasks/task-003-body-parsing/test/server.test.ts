import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("POST /api/echo should return the same data that was sent", async () => {
  const testData = { message: "Hello, World!", count: 42 };

  const res = await fetch("http://localhost:3003/api/echo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testData),
  });

  const data = await res.json();

  // This test FAILS because buggy code returns Promise object, not actual data
  expect(data.received).toEqual(testData);
});

test("POST /api/users should greet the user by name", async () => {
  const userData = { name: "Alice", email: "alice@example.com" };

  const res = await fetch("http://localhost:3003/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  // This test FAILS because userData.name is undefined (userData is a Promise)
  expect(data.message).toBe("Hello, Alice!");
  expect(data.user).toEqual(userData);
});

test("POST /api/calculate should add two numbers", async () => {
  const calcData = { a: 10, b: 25 };

  const res = await fetch("http://localhost:3003/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(calcData),
  });

  const data = await res.json();

  // This test FAILS because data.a and data.b are undefined
  expect(data.result).toBe(35);
  expect(data.input).toEqual(calcData);
});

test("POST /api/echo should include timestamp", async () => {
  const testData = { test: true };
  const beforeTime = Date.now();

  const res = await fetch("http://localhost:3003/api/echo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testData),
  });

  const data = await res.json();
  const afterTime = Date.now();

  expect(data.timestamp).toBeGreaterThanOrEqual(beforeTime);
  expect(data.timestamp).toBeLessThanOrEqual(afterTime);
});
