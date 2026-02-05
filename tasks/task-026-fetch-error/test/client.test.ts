import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchUserData, fetchMultipleResources, fetchWithRetry } from "../src/client";

// Mock server that can simulate failures
let server: ReturnType<typeof Bun.serve>;
const PORT = 9026;
const BASE_URL = `http://localhost:${PORT}`;

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/user") {
        return Response.json({ id: 1, name: "John", email: "john@example.com" });
      }

      if (url.pathname === "/error") {
        // Simulate server error
        return new Response("Internal Server Error", { status: 500 });
      }

      return new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => {
  server.stop();
});

describe("fetchUserData", () => {
  it("should return user data on success", async () => {
    const result = await fetchUserData(`${BASE_URL}/user`);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: 1,
      name: "John",
      email: "john@example.com"
    });
  });

  it("should handle network errors gracefully", async () => {
    // This URL will cause a connection refused error
    // BUG: This test will fail because fetch errors are not caught
    const result = await fetchUserData("http://localhost:59999/nonexistent");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("fetch");
  });

  it("should not throw on invalid URL", async () => {
    // BUG: This will throw instead of returning an error response
    const result = await fetchUserData("http://invalid-domain-that-does-not-exist.test/api");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("fetchMultipleResources", () => {
  it("should fetch multiple URLs successfully", async () => {
    const result = await fetchMultipleResources([
      `${BASE_URL}/user`,
      `${BASE_URL}/user`
    ]);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it("should handle partial failures gracefully", async () => {
    // BUG: One bad URL will crash the entire operation
    const result = await fetchMultipleResources([
      `${BASE_URL}/user`,
      "http://localhost:59999/bad",
      `${BASE_URL}/user`
    ]);

    // Should return partial results or error object, not throw
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("fetchWithRetry", () => {
  it("should retry on network failure", async () => {
    // BUG: Retry logic never executes because fetch error is not caught
    const result = await fetchWithRetry("http://localhost:59999/bad", 3);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should succeed on working endpoint", async () => {
    const result = await fetchWithRetry(`${BASE_URL}/user`, 3);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
