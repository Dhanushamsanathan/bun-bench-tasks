import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { postJson, putJson, patchJson, jsonRequest } from "../src/json-client";

// Mock server that validates JSON body
let server: ReturnType<typeof Bun.serve>;
const PORT = 9029;
const BASE_URL = `http://localhost:${PORT}`;

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/api/echo" && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers.get('Content-Type');

        // Read the raw body
        const rawBody = await req.text();

        // Check if body is the bug pattern
        if (rawBody === '[object Object]') {
          return Response.json(
            { error: 'Received [object Object] instead of valid JSON' },
            { status: 400 }
          );
        }

        // Try to parse as JSON
        try {
          const body = JSON.parse(rawBody);
          return Response.json({
            received: body,
            method: req.method,
            contentType
          });
        } catch (e) {
          return Response.json(
            { error: `Invalid JSON: ${rawBody.substring(0, 50)}` },
            { status: 400 }
          );
        }
      }

      if (url.pathname === "/api/users" && req.method === "POST") {
        const rawBody = await req.text();

        if (rawBody === '[object Object]') {
          return Response.json(
            { error: 'Invalid body format' },
            { status: 400 }
          );
        }

        try {
          const user = JSON.parse(rawBody);
          return Response.json({
            id: 1,
            ...user,
            created: true
          }, { status: 201 });
        } catch {
          return Response.json(
            { error: 'Failed to parse user data' },
            { status: 400 }
          );
        }
      }

      return new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => {
  server.stop();
});

describe("postJson", () => {
  it("should send properly formatted JSON body", async () => {
    const payload = { name: "John", age: 30 };

    // BUG: This will fail because body is sent as "[object Object]"
    const result = await postJson(`${BASE_URL}/api/echo`, payload);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      received: { name: "John", age: 30 },
      method: "POST",
      contentType: "application/json"
    });
  });

  it("should handle nested objects", async () => {
    const payload = {
      user: {
        name: "Jane",
        address: {
          city: "NYC",
          zip: "10001"
        }
      }
    };

    // BUG: Nested objects are also affected
    const result = await postJson(`${BASE_URL}/api/echo`, payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: payload
    });
  });

  it("should create a user with POST", async () => {
    const newUser = {
      name: "Alice",
      email: "alice@example.com"
    };

    // BUG: Server receives invalid JSON
    const result = await postJson<{ id: number; name: string; created: boolean }>(
      `${BASE_URL}/api/users`,
      newUser
    );

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(1);
    expect(result.data?.name).toBe("Alice");
    expect(result.data?.created).toBe(true);
  });

  it("should handle arrays in body", async () => {
    const payload = { items: [1, 2, 3], tags: ["a", "b"] };

    const result = await postJson(`${BASE_URL}/api/echo`, payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: { items: [1, 2, 3], tags: ["a", "b"] }
    });
  });
});

describe("putJson", () => {
  it("should send PUT with JSON body", async () => {
    const payload = { id: 1, name: "Updated" };

    // BUG: Same issue with PUT
    const result = await putJson(`${BASE_URL}/api/echo`, payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: payload,
      method: "PUT"
    });
  });
});

describe("patchJson", () => {
  it("should send PATCH with JSON body", async () => {
    const payload = { name: "Patched" };

    // BUG: Same issue with PATCH
    const result = await patchJson(`${BASE_URL}/api/echo`, payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: payload,
      method: "PATCH"
    });
  });
});

describe("jsonRequest", () => {
  it("should handle POST requests", async () => {
    const payload = { action: "test" };

    const result = await jsonRequest(`${BASE_URL}/api/echo`, 'POST', payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: payload,
      method: "POST"
    });
  });

  it("should handle PUT requests", async () => {
    const payload = { update: true };

    const result = await jsonRequest(`${BASE_URL}/api/echo`, 'PUT', payload);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      received: payload,
      method: "PUT"
    });
  });
});
