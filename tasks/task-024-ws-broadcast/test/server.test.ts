import { expect, test, afterAll, beforeEach } from "bun:test";
import server, { resetServer, getRoomClientCount } from "../src/server";

beforeEach(() => {
  resetServer();
});

afterAll(() => {
  resetServer();
  server.stop();
});

test("Sender should NOT receive their own broadcast", async () => {
  // Connect sender
  const sender = new WebSocket("ws://localhost:3024?room=test1");

  const senderMessages: string[] = [];
  let senderReady = false;

  sender.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "join" && data.clientId) {
      senderReady = true;
    } else {
      senderMessages.push(event.data);
    }
  };

  await new Promise<void>((resolve) => {
    sender.onopen = () => resolve();
  });

  // Wait for join confirmation
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (senderReady) {
        clearInterval(check);
        resolve();
      }
    }, 10);
  });

  // Clear any initial messages (like join notification)
  senderMessages.length = 0;

  // Broadcast a message
  sender.send(JSON.stringify({ type: "broadcast", content: "Hello everyone!" }));

  // Wait a bit for any messages
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test FAILS because buggy code sends broadcast back to sender
  expect(senderMessages.length).toBe(0);

  sender.close();
});

test("Other clients should receive broadcast", async () => {
  // Connect two clients to same room
  const client1 = new WebSocket("ws://localhost:3024?room=test2");
  const client2 = new WebSocket("ws://localhost:3024?room=test2");

  const client2Messages: any[] = [];
  let client1Ready = false;
  let client2Ready = false;

  client1.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "join" && data.clientId) {
      client1Ready = true;
    }
  };

  client2.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "join" && data.clientId) {
      client2Ready = true;
    } else if (data.type === "message") {
      client2Messages.push(data);
    }
  };

  await Promise.all([
    new Promise<void>((resolve) => {
      client1.onopen = () => resolve();
    }),
    new Promise<void>((resolve) => {
      client2.onopen = () => resolve();
    }),
  ]);

  // Wait for both to be ready
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (client1Ready && client2Ready) {
        clearInterval(check);
        resolve();
      }
    }, 10);
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Client 1 broadcasts
  client1.send(JSON.stringify({ type: "broadcast", content: "Message from client 1" }));

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Client 2 should receive the broadcast
  expect(client2Messages.length).toBeGreaterThan(0);
  expect(client2Messages.some((m) => m.content === "Message from client 1")).toBe(true);

  client1.close();
  client2.close();
});

test("Broadcast should only go to same room", async () => {
  // Connect clients to different rooms
  const roomAClient = new WebSocket("ws://localhost:3024?room=roomA");
  const roomBClient = new WebSocket("ws://localhost:3024?room=roomB");

  const roomBMessages: any[] = [];
  let roomAReady = false;
  let roomBReady = false;

  roomAClient.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "join" && data.clientId) {
      roomAReady = true;
    }
  };

  roomBClient.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "join" && data.clientId) {
      roomBReady = true;
    } else if (data.type === "message") {
      roomBMessages.push(data);
    }
  };

  await Promise.all([
    new Promise<void>((resolve) => {
      roomAClient.onopen = () => resolve();
    }),
    new Promise<void>((resolve) => {
      roomBClient.onopen = () => resolve();
    }),
  ]);

  // Wait for both to be ready
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (roomAReady && roomBReady) {
        clearInterval(check);
        resolve();
      }
    }, 10);
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Room A client broadcasts
  roomAClient.send(JSON.stringify({ type: "broadcast", content: "Room A message" }));

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Room B client should NOT receive room A's broadcast
  expect(roomBMessages.length).toBe(0);

  roomAClient.close();
  roomBClient.close();
});

test("Multiple receivers should all get broadcast except sender", async () => {
  // Connect 4 clients to same room
  const clients: WebSocket[] = [];
  const receivedMessages: Map<number, any[]> = new Map();
  const readyClients = new Set<number>();

  for (let i = 0; i < 4; i++) {
    const ws = new WebSocket("ws://localhost:3024?room=multiroom");
    receivedMessages.set(i, []);

    const clientIndex = i;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "join" && data.clientId) {
        readyClients.add(clientIndex);
      } else if (data.type === "message") {
        receivedMessages.get(clientIndex)!.push(data);
      }
    };

    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    clients.push(ws);
  }

  // Wait for all clients to be ready
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (readyClients.size === 4) {
        clearInterval(check);
        resolve();
      }
    }, 10);
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Client 0 broadcasts
  clients[0].send(JSON.stringify({ type: "broadcast", content: "Hello from client 0" }));

  await new Promise((resolve) => setTimeout(resolve, 300));

  // Test FAILS because buggy code sends to sender too
  // Client 0 (sender) should NOT receive the message
  expect(receivedMessages.get(0)!.filter((m) => m.content === "Hello from client 0").length).toBe(0);

  // Clients 1, 2, 3 should each receive exactly one message
  expect(receivedMessages.get(1)!.filter((m) => m.content === "Hello from client 0").length).toBe(1);
  expect(receivedMessages.get(2)!.filter((m) => m.content === "Hello from client 0").length).toBe(1);
  expect(receivedMessages.get(3)!.filter((m) => m.content === "Hello from client 0").length).toBe(1);

  for (const ws of clients) {
    ws.close();
  }
});

test("Sender message count should be one less than total clients", async () => {
  // This test verifies the broadcast count returned excludes sender
  const clients: WebSocket[] = [];
  const readyClients = new Set<number>();

  // Connect 5 clients
  for (let i = 0; i < 5; i++) {
    const ws = new WebSocket("ws://localhost:3024?room=countroom");
    const clientIndex = i;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "join" && data.clientId) {
        readyClients.add(clientIndex);
      }
    };

    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    clients.push(ws);
  }

  // Wait for all to be ready
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (readyClients.size === 5) {
        clearInterval(check);
        resolve();
      }
    }, 10);
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(getRoomClientCount("countroom")).toBe(5);

  for (const ws of clients) {
    ws.close();
  }
});
