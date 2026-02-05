// FIXED: Close event properly handles cleanup of all resources

export interface ClientData {
  id: string;
  connectedAt: number;
  heartbeatInterval?: Timer;
  subscriptions: Set<string>;
}

// Track connected clients and their data
export const activeClients = new Map<WebSocket<ClientData>, ClientData>();
export const topicSubscriptions = new Map<string, Set<WebSocket<ClientData>>>();

// Track cleanup events for testing
export const cleanupEvents: Array<{ clientId: string; timestamp: number }> = [];

let clientIdCounter = 0;

function generateClientId(): string {
  return `client-${++clientIdCounter}`;
}

export function getActiveClientCount(): number {
  return activeClients.size;
}

export function getTopicSubscriberCount(topic: string): number {
  return topicSubscriptions.get(topic)?.size ?? 0;
}

export function resetServer(): void {
  // Clear all state for testing
  for (const [ws, data] of activeClients) {
    if (data.heartbeatInterval) {
      clearInterval(data.heartbeatInterval);
    }
  }
  activeClients.clear();
  topicSubscriptions.clear();
  cleanupEvents.length = 0;
  clientIdCounter = 0;
}

const server = Bun.serve<ClientData>({
  port: 3023,
  fetch(req, server) {
    const url = new URL(req.url);

    // API endpoint to check client count
    if (url.pathname === "/api/clients") {
      return new Response(JSON.stringify({ count: getActiveClientCount() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return;
    }
    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      const clientId = generateClientId();
      const clientData: ClientData = {
        id: clientId,
        connectedAt: Date.now(),
        subscriptions: new Set(),
      };

      // Store client data
      activeClients.set(ws, clientData);
      ws.data = clientData;

      // Start heartbeat interval
      clientData.heartbeatInterval = setInterval(() => {
        try {
          ws.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));
        } catch (e) {
          // Client might be disconnected
        }
      }, 5000);

      ws.send(JSON.stringify({ type: "connected", clientId }));
    },
    message(ws, message) {
      const data = ws.data;
      if (!data) return;

      try {
        const parsed = JSON.parse(message.toString());

        if (parsed.type === "subscribe" && parsed.topic) {
          // Subscribe to topic
          data.subscriptions.add(parsed.topic);
          if (!topicSubscriptions.has(parsed.topic)) {
            topicSubscriptions.set(parsed.topic, new Set());
          }
          topicSubscriptions.get(parsed.topic)!.add(ws);
          ws.send(JSON.stringify({ type: "subscribed", topic: parsed.topic }));
        } else if (parsed.type === "unsubscribe" && parsed.topic) {
          // Unsubscribe from topic
          data.subscriptions.delete(parsed.topic);
          topicSubscriptions.get(parsed.topic)?.delete(ws);
          ws.send(JSON.stringify({ type: "unsubscribed", topic: parsed.topic }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    },
    close(ws, code, reason) {
      const data = ws.data;
      if (!data) return;

      // FIXED: Clear the heartbeat interval to prevent memory leaks
      if (data.heartbeatInterval) {
        clearInterval(data.heartbeatInterval);
        data.heartbeatInterval = undefined;
      }

      // FIXED: Remove client from all topic subscriptions
      for (const topic of data.subscriptions) {
        topicSubscriptions.get(topic)?.delete(ws);
      }
      data.subscriptions.clear();

      // FIXED: Remove client from activeClients map
      activeClients.delete(ws);

      // FIXED: Record cleanup event for tracking
      cleanupEvents.push({
        clientId: data.id,
        timestamp: Date.now(),
      });

      console.log(`Client ${data.id} disconnected and cleaned up`);
    },
  },
});

export default server;
