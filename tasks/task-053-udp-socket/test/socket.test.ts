import { expect, test, afterEach, beforeEach } from "bun:test";
import {
  createUdpSocket,
  clearReceivedMessages,
  type UdpMessage,
  type UdpSocketResult,
} from "../src/socket";

let serverSocket: UdpSocketResult | null = null;
let clientSocket: UdpSocketResult | null = null;

beforeEach(() => {
  clearReceivedMessages();
});

afterEach(async () => {
  serverSocket?.close();
  clientSocket?.close();
  serverSocket = null;
  clientSocket = null;
  await Bun.sleep(50);
});

test("UDP socket should bind to specified port", async () => {
  const targetPort = 4053;

  serverSocket = await createUdpSocket({
    port: targetPort,
    onMessage: () => {},
  });

  // Test FAILS because buggy code binds to random port
  expect(serverSocket.port).toBe(targetPort);
});

test("UDP socket should receive messages with sender info", async () => {
  const serverPort = 4054;
  let receivedMessage: UdpMessage | null = null;

  serverSocket = await createUdpSocket({
    port: serverPort,
    onMessage: (msg) => {
      receivedMessage = msg;
    },
  });

  // Create client socket
  clientSocket = await createUdpSocket({
    port: 4055,
    onMessage: () => {},
  });

  // Send message from client to server
  clientSocket.send("Hello, Server!", "127.0.0.1", serverPort);

  await Bun.sleep(200);

  // Test FAILS because buggy code doesn't capture sender info
  expect(receivedMessage).not.toBeNull();
  expect(receivedMessage?.data).toBe("Hello, Server!");
  expect(receivedMessage?.senderAddress).toBeTruthy();
  expect(receivedMessage?.senderPort).toBe(4055);
});

test("UDP socket should send response to correct sender", async () => {
  const serverPort = 4056;
  const clientPort = 4057;
  let clientReceived: UdpMessage | null = null;

  // Create echo server
  serverSocket = await createUdpSocket({
    port: serverPort,
    onMessage: (msg) => {
      // Echo back to sender
      if (msg.senderAddress && msg.senderPort) {
        serverSocket?.send(`Echo: ${msg.data}`, msg.senderAddress, msg.senderPort);
      }
    },
  });

  // Create client
  clientSocket = await createUdpSocket({
    port: clientPort,
    onMessage: (msg) => {
      clientReceived = msg;
    },
  });

  // Send message
  clientSocket.send("Ping", "127.0.0.1", serverPort);

  await Bun.sleep(300);

  // Test FAILS because buggy code can't echo back (no sender info)
  expect(clientReceived).not.toBeNull();
  expect(clientReceived?.data).toBe("Echo: Ping");
});

test("UDP socket should handle multiple messages", async () => {
  const serverPort = 4058;
  const messages: UdpMessage[] = [];

  serverSocket = await createUdpSocket({
    port: serverPort,
    onMessage: (msg) => {
      messages.push(msg);
    },
  });

  clientSocket = await createUdpSocket({
    port: 4059,
    onMessage: () => {},
  });

  // Send multiple messages
  clientSocket.send("Message 1", "127.0.0.1", serverPort);
  clientSocket.send("Message 2", "127.0.0.1", serverPort);
  clientSocket.send("Message 3", "127.0.0.1", serverPort);

  await Bun.sleep(300);

  expect(messages.length).toBe(3);
  expect(messages.map((m) => m.data)).toContain("Message 1");
  expect(messages.map((m) => m.data)).toContain("Message 2");
  expect(messages.map((m) => m.data)).toContain("Message 3");
});

test("UDP socket should report actual bound port", async () => {
  // Create socket without specifying port (should get random port)
  serverSocket = await createUdpSocket({
    port: 0, // Request any available port
    onMessage: () => {},
  });

  // The port should be a valid port number
  expect(serverSocket.port).toBeGreaterThan(0);
  expect(serverSocket.port).toBeLessThanOrEqual(65535);
});

test("UDP socket should handle binary data", async () => {
  const serverPort = 4060;
  let receivedData: string | null = null;

  serverSocket = await createUdpSocket({
    port: serverPort,
    onMessage: (msg) => {
      receivedData = msg.data;
    },
  });

  clientSocket = await createUdpSocket({
    port: 4061,
    onMessage: () => {},
  });

  // Send message with special characters
  const testMessage = "Hello\x00World\xFF!";
  clientSocket.send(testMessage, "127.0.0.1", serverPort);

  await Bun.sleep(200);

  expect(receivedData).toBeTruthy();
});
