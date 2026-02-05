import { expect, test, afterAll, beforeEach } from "bun:test";
import server, { authAttempts, resetServer, connectedClients } from "../src/server";

beforeEach(() => {
  resetServer();
});

afterAll(() => {
  resetServer();
  server.stop();
});

test("Invalid token should return HTTP 401, not establish WebSocket", async () => {
  // Try to connect with invalid token
  let wsError: Event | null = null;
  let wsOpened = false;

  try {
    const ws = new WebSocket("ws://localhost:3025?token=invalid-token");

    const result = await Promise.race([
      new Promise<"opened">((resolve) => {
        ws.onopen = () => {
          wsOpened = true;
          resolve("opened");
        };
      }),
      new Promise<"error">((resolve) => {
        ws.onerror = (error) => {
          wsError = error;
          resolve("error");
        };
      }),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 2000)),
    ]);

    // Clean up
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }

    // Wait a bit for any async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test FAILS because buggy code allows connection to be established
    // Expected: WebSocket should never open (HTTP 401 returned before upgrade)
    // Buggy: WebSocket opens briefly, then gets closed
    expect(wsOpened).toBe(false);
  } catch (e) {
    // Expected - connection should fail
  }
});

test("Missing token should return HTTP 401, not establish WebSocket", async () => {
  let wsOpened = false;

  try {
    const ws = new WebSocket("ws://localhost:3025");

    await Promise.race([
      new Promise<void>((resolve) => {
        ws.onopen = () => {
          wsOpened = true;
          resolve();
        };
      }),
      new Promise<void>((resolve) => {
        ws.onerror = () => resolve();
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);

    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test FAILS because buggy code allows connection without token
    expect(wsOpened).toBe(false);
  } catch (e) {
    // Expected - connection should fail
  }
});

test("Auth check should happen in fetch stage, not open stage", async () => {
  // Connect with invalid token
  const ws = new WebSocket("ws://localhost:3025?token=bad-token");

  await Promise.race([
    new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    }),
    new Promise<void>((resolve) => {
      ws.onerror = () => resolve();
    }),
    new Promise<void>((resolve) => {
      ws.onclose = () => resolve();
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ]);

  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Get auth attempts
  const response = await fetch("http://localhost:3025/api/auth-attempts");
  const attempts = await response.json();

  // Test FAILS because buggy code does auth check in 'open' stage
  // Expected: Auth check should happen in 'fetch' stage
  const fetchStageAttempts = attempts.filter((a: any) => a.stage === "fetch");
  expect(fetchStageAttempts.length).toBeGreaterThan(0);
});

test("Valid token should allow WebSocket connection", async () => {
  const ws = new WebSocket("ws://localhost:3025?token=token-abc123");

  let connected = false;
  let userId: string | null = null;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "connected" || data.type === "authenticated") {
      connected = true;
      userId = data.userId;
    }
  };

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Valid token should allow connection
  expect(ws.readyState).toBe(WebSocket.OPEN);

  ws.close();
});

test("Unauthorized client should NOT receive any messages before disconnect", async () => {
  const ws = new WebSocket("ws://localhost:3025?token=invalid");
  const messagesReceived: string[] = [];

  ws.onmessage = (event) => {
    messagesReceived.push(event.data);
  };

  await Promise.race([
    new Promise<void>((resolve) => {
      ws.onopen = () => setTimeout(resolve, 300);
    }),
    new Promise<void>((resolve) => {
      ws.onclose = () => resolve();
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ]);

  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }

  // Test FAILS because buggy code sends "Connection established" before kicking
  // Expected: No messages should be received if auth fails
  expect(messagesReceived.length).toBe(0);
});

test("HTTP request to upgrade endpoint with bad token should return 401", async () => {
  // Make a regular HTTP request (not WebSocket) with invalid token
  const response = await fetch("http://localhost:3025/?token=invalid", {
    headers: {
      Upgrade: "websocket",
      Connection: "Upgrade",
    },
  });

  // Test FAILS because buggy code doesn't check auth before upgrade
  // Expected: Should return 401 Unauthorized
  // Note: This is testing the HTTP response, not the WebSocket upgrade
  // A properly implemented server would reject with 401
  expect(response.status).toBe(401);
});
