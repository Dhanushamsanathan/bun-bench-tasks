import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchWithTimeout, fetchWithOptions, fetchWithRaceTimeout } from "../src/timeout";

// Mock server that can simulate slow responses
let server: ReturnType<typeof Bun.serve>;
const PORT = 9027;
const BASE_URL = `http://localhost:${PORT}`;

beforeAll(() => {
  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/fast") {
        return Response.json({ message: "fast response" });
      }

      if (url.pathname === "/slow") {
        // Simulate a slow endpoint (3 second delay)
        await new Promise(resolve => setTimeout(resolve, 3000));
        return Response.json({ message: "slow response" });
      }

      if (url.pathname === "/very-slow") {
        // Simulate a very slow endpoint (10 second delay)
        await new Promise(resolve => setTimeout(resolve, 10000));
        return Response.json({ message: "very slow response" });
      }

      return new Response("Not Found", { status: 404 });
    }
  });
});

afterAll(() => {
  server.stop();
});

describe("fetchWithTimeout", () => {
  it("should return data for fast endpoints", async () => {
    const result = await fetchWithTimeout(`${BASE_URL}/fast`, 1000);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "fast response" });
  });

  it("should timeout for slow endpoints", async () => {
    // BUG: This test will hang because timeout is not implemented
    // Setting a short timeout that should trigger before the 3s delay
    const startTime = Date.now();
    const result = await fetchWithTimeout(`${BASE_URL}/slow`, 500);
    const elapsed = Date.now() - startTime;

    // Should timeout quickly, not wait 3 seconds
    expect(elapsed).toBeLessThan(1000);
    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.error?.toLowerCase()).toMatch(/time.*out/);
  }, 2000); // Test timeout to prevent hanging forever

  it("should abort the actual request on timeout", async () => {
    // BUG: Even if we "timeout", the underlying fetch continues
    const result = await fetchWithTimeout(`${BASE_URL}/slow`, 100);

    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
  }, 1000);
});

describe("fetchWithOptions", () => {
  it("should respect timeout option", async () => {
    // BUG: timeout option is ignored
    const startTime = Date.now();
    const result = await fetchWithOptions(`${BASE_URL}/slow`, {
      timeout: 500
    });
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(1000);
    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
  }, 2000);

  it("should work with custom headers and timeout", async () => {
    const result = await fetchWithOptions(`${BASE_URL}/fast`, {
      timeout: 1000,
      headers: { 'X-Custom': 'value' }
    });

    expect(result.success).toBe(true);
  });
});

describe("fetchWithRaceTimeout", () => {
  it("should return timeout result for slow requests", async () => {
    const startTime = Date.now();
    const result = await fetchWithRaceTimeout(`${BASE_URL}/slow`, 500);
    const elapsed = Date.now() - startTime;

    // Race should resolve quickly with timeout
    expect(elapsed).toBeLessThan(1000);
    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
  }, 2000);

  it("should actually cancel the fetch request", async () => {
    // BUG: The fetch continues in background even after timeout
    // This test verifies the request is truly cancelled
    const result = await fetchWithRaceTimeout(`${BASE_URL}/very-slow`, 100);

    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
    // The fetch should be aborted, not just ignored
  }, 1000);

  it("should succeed for fast requests", async () => {
    const result = await fetchWithRaceTimeout(`${BASE_URL}/fast`, 5000);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "fast response" });
    expect(result.timedOut).toBeUndefined();
  });
});
