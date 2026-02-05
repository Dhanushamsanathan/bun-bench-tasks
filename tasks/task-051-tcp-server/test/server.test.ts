import { expect, test, afterAll, beforeEach } from "bun:test";
import server, { getConnectionCount, resetConnections } from "../src/server";

afterAll(() => {
  server.stop();
});

beforeEach(() => {
  resetConnections();
});

test("TCP server should track new connections", async () => {
  const client = await Bun.connect({
    hostname: "localhost",
    port: 3051,
    socket: {
      data(socket, data) {},
      open(socket) {},
      close(socket) {},
      error(socket, error) {},
    },
  });

  // Wait for connection to be established
  await Bun.sleep(50);

  expect(getConnectionCount()).toBe(1);

  client.end();
  await Bun.sleep(50);
});

test("TCP server should clean up after client disconnect", async () => {
  const client = await Bun.connect({
    hostname: "localhost",
    port: 3051,
    socket: {
      data(socket, data) {},
      open(socket) {},
      close(socket) {},
      error(socket, error) {},
    },
  });

  // Wait for connection
  await Bun.sleep(50);
  expect(getConnectionCount()).toBe(1);

  // Disconnect client
  client.end();
  await Bun.sleep(100);

  // Test FAILS because buggy code doesn't remove socket from Set
  expect(getConnectionCount()).toBe(0);
});

test("TCP server should handle multiple client connect/disconnect cycles", async () => {
  // Connect and disconnect 5 clients
  for (let i = 0; i < 5; i++) {
    const client = await Bun.connect({
      hostname: "localhost",
      port: 3051,
      socket: {
        data(socket, data) {},
        open(socket) {},
        close(socket) {},
        error(socket, error) {},
      },
    });

    await Bun.sleep(30);
    client.end();
    await Bun.sleep(30);
  }

  // Test FAILS because buggy code reports 5 connections instead of 0
  expect(getConnectionCount()).toBe(0);
});

test("TCP server should accurately count concurrent connections", async () => {
  const clients = [];

  // Connect 3 clients
  for (let i = 0; i < 3; i++) {
    const client = await Bun.connect({
      hostname: "localhost",
      port: 3051,
      socket: {
        data(socket, data) {},
        open(socket) {},
        close(socket) {},
        error(socket, error) {},
      },
    });
    clients.push(client);
    await Bun.sleep(30);
  }

  expect(getConnectionCount()).toBe(3);

  // Disconnect first 2 clients
  clients[0].end();
  clients[1].end();
  await Bun.sleep(100);

  // Test FAILS because buggy code still reports 3 connections
  expect(getConnectionCount()).toBe(1);

  // Disconnect last client
  clients[2].end();
  await Bun.sleep(100);

  expect(getConnectionCount()).toBe(0);
});

test("TCP server should echo messages back to client", async () => {
  let receivedData = "";

  const client = await Bun.connect({
    hostname: "localhost",
    port: 3051,
    socket: {
      data(socket, data) {
        receivedData += data.toString();
      },
      open(socket) {},
      close(socket) {},
      error(socket, error) {},
    },
  });

  await Bun.sleep(50);

  // Send test message
  client.write("Hello, Server!");
  await Bun.sleep(100);

  expect(receivedData).toContain("Welcome!");
  expect(receivedData).toContain("Echo: Hello, Server!");

  client.end();
  await Bun.sleep(50);
});
