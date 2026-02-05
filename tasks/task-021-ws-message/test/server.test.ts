import { expect, test, afterAll, beforeAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("WebSocket should parse JSON and respond with processed result", async () => {
  const ws = new WebSocket("ws://localhost:3021");

  const responsePromise = new Promise<string>((resolve, reject) => {
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send a JSON message
  ws.send(JSON.stringify({ action: "echo", data: "hello" }));

  const response = await responsePromise;
  const parsed = JSON.parse(response);

  // Test FAILS because buggy code returns the raw message, not a processed response
  expect(parsed).toHaveProperty("status", "ok");
  expect(parsed).toHaveProperty("action", "echo");
  expect(parsed).toHaveProperty("result", "hello");

  ws.close();
});

test("WebSocket should handle uppercase action", async () => {
  const ws = new WebSocket("ws://localhost:3021");

  const responsePromise = new Promise<string>((resolve, reject) => {
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send a JSON message with uppercase action
  ws.send(JSON.stringify({ action: "UPPERCASE", data: "test message" }));

  const response = await responsePromise;
  const parsed = JSON.parse(response);

  // Test FAILS because buggy code doesn't process the action
  expect(parsed).toHaveProperty("status", "ok");
  expect(parsed).toHaveProperty("action", "UPPERCASE");
  expect(parsed).toHaveProperty("result", "TEST MESSAGE");

  ws.close();
});

test("WebSocket should handle reverse action", async () => {
  const ws = new WebSocket("ws://localhost:3021");

  const responsePromise = new Promise<string>((resolve, reject) => {
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send a JSON message with reverse action
  ws.send(JSON.stringify({ action: "reverse", data: "hello" }));

  const response = await responsePromise;
  const parsed = JSON.parse(response);

  // Test FAILS because buggy code doesn't process the action
  expect(parsed).toHaveProperty("status", "ok");
  expect(parsed).toHaveProperty("action", "reverse");
  expect(parsed).toHaveProperty("result", "olleh");

  ws.close();
});

test("WebSocket should return error for invalid JSON", async () => {
  const ws = new WebSocket("ws://localhost:3021");

  const responsePromise = new Promise<string>((resolve, reject) => {
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send invalid JSON
  ws.send("not valid json");

  const response = await responsePromise;
  const parsed = JSON.parse(response);

  // Test FAILS because buggy code doesn't validate or return proper error
  expect(parsed).toHaveProperty("status", "error");
  expect(parsed).toHaveProperty("message");

  ws.close();
});
