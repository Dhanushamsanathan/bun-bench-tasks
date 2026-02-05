import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { AuthenticatedClient, createAuthHeaders, isValidBearerToken } from "../src/auth-client";

// Mock server that validates Bearer token format
let server: ReturnType<typeof Bun.serve>;
const PORT = 9028;
const BASE_URL = `http://localhost:${PORT}`;
const VALID_TOKEN = "abc123xyz";

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const authHeader = req.headers.get('Authorization');

      // Validate Bearer token format
      if (!authHeader) {
        return Response.json(
          { error: 'No Authorization header' },
          { status: 401 }
        );
      }

      // Server expects "Bearer <token>" format
      if (!authHeader.startsWith('Bearer ')) {
        return Response.json(
          { error: 'Invalid Authorization format. Expected: Bearer <token>' },
          { status: 401 }
        );
      }

      const token = authHeader.slice(7); // Remove "Bearer " prefix
      if (token !== VALID_TOKEN) {
        return Response.json(
          { error: 'Invalid token' },
          { status: 403 }
        );
      }

      const url = new URL(req.url);

      if (url.pathname === "/api/user") {
        return Response.json({
          id: 1,
          name: "John Doe",
          email: "john@example.com"
        });
      }

      if (url.pathname === "/api/data" && req.method === "POST") {
        const body = await req.json();
        return Response.json({
          received: body,
          processed: true
        });
      }

      return new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => {
  server.stop();
});

describe("AuthenticatedClient", () => {
  it("should send correct Authorization header format", async () => {
    const client = new AuthenticatedClient({
      baseUrl: BASE_URL,
      token: VALID_TOKEN
    });

    // BUG: This will fail with 401 because token is sent without "Bearer " prefix
    const result = await client.get("/api/user");

    expect(result.success).toBe(true);
    expect(result.status).toBeUndefined(); // No error status
    expect(result.data).toEqual({
      id: 1,
      name: "John Doe",
      email: "john@example.com"
    });
  });

  it("should authenticate POST requests", async () => {
    const client = new AuthenticatedClient({
      baseUrl: BASE_URL,
      token: VALID_TOKEN
    });

    // BUG: This will also fail with 401
    const result = await client.post("/api/data", { message: "hello" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      received: { message: "hello" },
      processed: true
    });
  });

  it("should work after token update", async () => {
    const client = new AuthenticatedClient({
      baseUrl: BASE_URL,
      token: "old-token"
    });

    client.setToken(VALID_TOKEN);

    // BUG: Still fails because Bearer prefix is missing
    const result = await client.get("/api/user");

    expect(result.success).toBe(true);
  });

  it("should fail with wrong token", async () => {
    const client = new AuthenticatedClient({
      baseUrl: BASE_URL,
      token: "wrong-token"
    });

    const result = await client.get("/api/user");

    // This should fail with 403 (wrong token), not 401 (bad format)
    // BUG: Actually fails with 401 because of missing Bearer prefix
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe("createAuthHeaders", () => {
  it("should create valid Bearer token header", () => {
    const headers = createAuthHeaders("mytoken123");

    // BUG: Headers don't include "Bearer " prefix
    expect(headers['Authorization']).toBe('Bearer mytoken123');
    expect(isValidBearerToken(headers['Authorization'])).toBe(true);
  });

  it("should include Content-Type header", () => {
    const headers = createAuthHeaders("token");

    expect(headers['Content-Type']).toBe('application/json');
  });
});

describe("isValidBearerToken", () => {
  it("should validate correct Bearer token format", () => {
    expect(isValidBearerToken("Bearer abc123")).toBe(true);
    expect(isValidBearerToken("Bearer x")).toBe(true);
  });

  it("should reject invalid formats", () => {
    expect(isValidBearerToken("abc123")).toBe(false);
    expect(isValidBearerToken("bearer abc123")).toBe(false);
    expect(isValidBearerToken("Bearer ")).toBe(false);
    expect(isValidBearerToken("")).toBe(false);
  });
});
