import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("GET /api/user should return application/json Content-Type", async () => {
  const res = await fetch("http://localhost:3002/api/user");
  const contentType = res.headers.get("Content-Type");

  // This test FAILS because buggy code doesn't set Content-Type header
  // It returns "text/plain;charset=utf-8" instead of "application/json"
  expect(contentType).toContain("application/json");
});

test("GET /api/items should return application/json Content-Type", async () => {
  const res = await fetch("http://localhost:3002/api/items");
  const contentType = res.headers.get("Content-Type");

  // This test FAILS for the same reason
  expect(contentType).toContain("application/json");
});

test("GET /api/user should return valid JSON data", async () => {
  const res = await fetch("http://localhost:3002/api/user");
  const data = await res.json();

  expect(data).toHaveProperty("id");
  expect(data).toHaveProperty("name");
  expect(data).toHaveProperty("email");
  expect(data.name).toBe("John Doe");
});

test("GET /api/items should return array of items", async () => {
  const res = await fetch("http://localhost:3002/api/items");
  const data = await res.json();

  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBe(3);
  expect(data[0]).toHaveProperty("id");
  expect(data[0]).toHaveProperty("name");
});
