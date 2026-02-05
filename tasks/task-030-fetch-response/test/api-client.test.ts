import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  fetchApi,
  fetchUser,
  createResource,
  deleteResource,
  fetchWithRetry
} from "../src/api-client";

// Mock server that returns various HTTP status codes
let server: ReturnType<typeof Bun.serve>;
const PORT = 9030;
const BASE_URL = `http://localhost:${PORT}`;
let retryCount = 0;

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      // Successful endpoint
      if (url.pathname === "/api/success") {
        return Response.json({ message: "Success", value: 42 });
      }

      // 404 Not Found
      if (url.pathname === "/api/notfound") {
        return Response.json(
          { error: "Resource not found" },
          { status: 404 }
        );
      }

      // 500 Internal Server Error
      if (url.pathname === "/api/error") {
        return Response.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }

      // User endpoints
      if (url.pathname === "/users/1") {
        return Response.json({ id: 1, name: "John" });
      }

      if (url.pathname === "/users/999") {
        return Response.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // POST with validation
      if (url.pathname === "/api/create" && req.method === "POST") {
        const body = await req.json();

        if (!body.name) {
          return Response.json(
            { error: "Name is required" },
            { status: 400 }
          );
        }

        return Response.json({ id: 1, ...body }, { status: 201 });
      }

      // DELETE endpoints
      if (url.pathname === "/api/delete/1" && req.method === "DELETE") {
        return new Response(null, { status: 204 });
      }

      if (url.pathname === "/api/delete/forbidden" && req.method === "DELETE") {
        return Response.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      // Retry endpoint - fails first 2 times
      if (url.pathname === "/api/flaky") {
        retryCount++;
        if (retryCount <= 2) {
          return Response.json(
            { error: "Service unavailable" },
            { status: 503 }
          );
        }
        retryCount = 0;
        return Response.json({ message: "Finally worked" });
      }

      return new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => {
  server.stop();
});

describe("fetchApi", () => {
  it("should return success for 200 response", async () => {
    const result = await fetchApi(`${BASE_URL}/api/success`);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "Success", value: 42 });
  });

  it("should return failure for 404 response", async () => {
    // BUG: This will incorrectly return success: true
    const result = await fetchApi(`${BASE_URL}/api/notfound`);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toContain("404");
  });

  it("should return failure for 500 response", async () => {
    // BUG: This will incorrectly return success: true
    const result = await fetchApi(`${BASE_URL}/api/error`);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toContain("500");
  });
});

describe("fetchUser", () => {
  it("should return user for existing ID", async () => {
    const result = await fetchUser(BASE_URL, 1);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: "John" });
  });

  it("should return failure for non-existent user", async () => {
    // BUG: This returns success: true with error object as data
    const result = await fetchUser(BASE_URL, 999);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toContain("not found");
  });
});

describe("createResource", () => {
  it("should create resource with valid data", async () => {
    const result = await createResource(`${BASE_URL}/api/create`, {
      name: "Test"
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ id: 1, name: "Test" });
  });

  it("should return failure for validation error", async () => {
    // BUG: 400 Bad Request is treated as success
    const result = await createResource(`${BASE_URL}/api/create`, {});

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain("required");
  });
});

describe("deleteResource", () => {
  it("should succeed for valid deletion", async () => {
    const result = await deleteResource(`${BASE_URL}/api/delete/1`);

    expect(result.success).toBe(true);
  });

  it("should return failure for forbidden deletion", async () => {
    // BUG: 403 Forbidden is treated as success
    const result = await deleteResource(`${BASE_URL}/api/delete/forbidden`);

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe("fetchWithRetry", () => {
  it("should retry on 5xx errors", async () => {
    // Reset retry counter
    retryCount = 0;

    // BUG: 503 is treated as success, no retry happens
    // This should retry and eventually succeed
    const result = await fetchWithRetry(`${BASE_URL}/api/flaky`, 3);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "Finally worked" });
  });

  it("should return failure after max retries", async () => {
    // Endpoint that always returns 500
    const result = await fetchWithRetry(`${BASE_URL}/api/error`, 2);

    expect(result.success).toBe(false);
  });
});
