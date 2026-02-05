import { expect, test, afterAll, beforeAll } from "bun:test";
import { createTcpClient, type ClientOptions } from "../src/client";
import type { Socket } from "bun";

// Create a simple test server
let testServer: ReturnType<typeof Bun.listen> | null = null;

beforeAll(() => {
  testServer = Bun.listen({
    hostname: "localhost",
    port: 3052,
    socket: {
      open(socket) {
        socket.write("Hello from server\n");
      },
      data(socket, data) {
        socket.write(`Echo: ${data}`);
      },
      close(socket) {},
      error(socket, error) {},
    },
  });
});

afterAll(() => {
  testServer?.stop();
});

test("TCP client should connect to running server", async () => {
  let connected = false;

  const result = await createTcpClient({
    hostname: "localhost",
    port: 3052,
    onConnect: () => {
      connected = true;
    },
  });

  await Bun.sleep(50);

  expect(result.success).toBe(true);
  expect(connected).toBe(true);

  result.socket?.end();
});

test("TCP client should receive data from server", async () => {
  let receivedData = "";

  const result = await createTcpClient({
    hostname: "localhost",
    port: 3052,
    onData: (data) => {
      receivedData += data;
    },
  });

  await Bun.sleep(100);

  expect(receivedData).toContain("Hello from server");

  result.socket?.end();
});

test("TCP client should call onError for connection refused", async () => {
  let errorCalled = false;
  let errorMessage = "";

  // Try to connect to a port where no server is running
  const result = await createTcpClient({
    hostname: "localhost",
    port: 39999, // Port with no server
    onError: (error) => {
      errorCalled = true;
      errorMessage = error.message;
    },
  });

  await Bun.sleep(200);

  // Test FAILS because buggy code doesn't call onError
  expect(result.success).toBe(false);
  expect(errorCalled).toBe(true);
  expect(errorMessage).toBeTruthy();
});

test("TCP client should handle connection timeout", async () => {
  let errorCalled = false;
  let timedOut = false;

  // Try to connect to a non-routable address (will timeout)
  const result = await createTcpClient({
    hostname: "10.255.255.1", // Non-routable address
    port: 3052,
    timeout: 500, // 500ms timeout
    onError: (error) => {
      errorCalled = true;
      if (error.message.toLowerCase().includes("timeout")) {
        timedOut = true;
      }
    },
  });

  await Bun.sleep(600);

  // Test FAILS because buggy code doesn't implement timeout
  expect(result.success).toBe(false);
  expect(errorCalled).toBe(true);
  expect(timedOut).toBe(true);
});

test("TCP client should return error result for failed connection", async () => {
  const result = await createTcpClient({
    hostname: "localhost",
    port: 39998, // Port with no server
  });

  await Bun.sleep(200);

  // Test FAILS because buggy code always returns success: true
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.error?.message).toBeTruthy();
});

test("TCP client should call onClose when connection ends", async () => {
  let closeCalled = false;

  const result = await createTcpClient({
    hostname: "localhost",
    port: 3052,
    onClose: () => {
      closeCalled = true;
    },
  });

  await Bun.sleep(50);

  // Close the connection
  result.socket?.end();
  await Bun.sleep(100);

  expect(closeCalled).toBe(true);
});
