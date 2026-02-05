import { expect, test, afterAll, beforeEach } from "bun:test";
import server, {
  activeClients,
  topicSubscriptions,
  cleanupEvents,
  getActiveClientCount,
  getTopicSubscriberCount,
  resetServer,
} from "../src/server";

beforeEach(() => {
  resetServer();
});

afterAll(() => {
  resetServer();
  server.stop();
});

test("Client count should decrease when client disconnects", async () => {
  const ws = new WebSocket("ws://localhost:3023");

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Wait for connection to be registered
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(getActiveClientCount()).toBe(1);

  // Close the connection
  ws.close();

  // Wait for close handler to run
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test FAILS because buggy code doesn't remove client from activeClients
  expect(getActiveClientCount()).toBe(0);
});

test("Multiple clients should all be cleaned up on disconnect", async () => {
  const clients: WebSocket[] = [];

  // Connect 3 clients
  for (let i = 0; i < 3; i++) {
    const ws = new WebSocket("ws://localhost:3023");
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });
    clients.push(ws);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(getActiveClientCount()).toBe(3);

  // Disconnect all clients
  for (const ws of clients) {
    ws.close();
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test FAILS because buggy code doesn't clean up clients
  expect(getActiveClientCount()).toBe(0);
});

test("Topic subscriptions should be cleaned up on disconnect", async () => {
  const ws = new WebSocket("ws://localhost:3023");

  const messagePromise = new Promise<void>((resolve) => {
    let messageCount = 0;
    ws.onmessage = () => {
      messageCount++;
      if (messageCount >= 2) resolve(); // connected + subscribed
    };
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Subscribe to a topic
  ws.send(JSON.stringify({ type: "subscribe", topic: "news" }));

  await messagePromise;
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(getTopicSubscriberCount("news")).toBe(1);

  // Disconnect
  ws.close();

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test FAILS because buggy code doesn't remove from topic subscriptions
  expect(getTopicSubscriberCount("news")).toBe(0);
});

test("Cleanup events should be recorded on disconnect", async () => {
  const ws = new WebSocket("ws://localhost:3023");

  let clientId: string | undefined;

  await new Promise<void>((resolve) => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connected") {
        clientId = data.clientId;
        resolve();
      }
    };
    ws.onopen = () => {}; // Wait for connected message
  });

  // Disconnect
  ws.close();

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test FAILS because buggy code doesn't record cleanup events
  expect(cleanupEvents.length).toBe(1);
  expect(cleanupEvents[0].clientId).toBe(clientId);
});

test("Heartbeat interval should be cleared on disconnect", async () => {
  const ws = new WebSocket("ws://localhost:3023");

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get the client data to check interval
  const clientEntry = Array.from(activeClients.entries())[0];
  expect(clientEntry).toBeDefined();

  const [, clientData] = clientEntry;
  expect(clientData.heartbeatInterval).toBeDefined();

  // Store reference to check if cleared
  const intervalId = clientData.heartbeatInterval;

  // Disconnect
  ws.close();

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test FAILS because buggy code doesn't clear the interval
  // After cleanup, the client should be removed from activeClients
  // and the interval should have been cleared
  expect(getActiveClientCount()).toBe(0);
});

test("Client with multiple subscriptions should have all cleaned up", async () => {
  const ws = new WebSocket("ws://localhost:3023");

  let messagesReceived = 0;
  const messagePromise = new Promise<void>((resolve) => {
    ws.onmessage = () => {
      messagesReceived++;
      if (messagesReceived >= 4) resolve(); // connected + 3 subscribed
    };
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Subscribe to multiple topics
  ws.send(JSON.stringify({ type: "subscribe", topic: "topic1" }));
  ws.send(JSON.stringify({ type: "subscribe", topic: "topic2" }));
  ws.send(JSON.stringify({ type: "subscribe", topic: "topic3" }));

  await messagePromise;
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(getTopicSubscriberCount("topic1")).toBe(1);
  expect(getTopicSubscriberCount("topic2")).toBe(1);
  expect(getTopicSubscriberCount("topic3")).toBe(1);

  // Disconnect
  ws.close();

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test FAILS because buggy code doesn't clean up all subscriptions
  expect(getTopicSubscriberCount("topic1")).toBe(0);
  expect(getTopicSubscriberCount("topic2")).toBe(0);
  expect(getTopicSubscriberCount("topic3")).toBe(0);
});
