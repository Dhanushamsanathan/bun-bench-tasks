// BUG: Broadcasting sends to sender too, should exclude sender
// This causes duplicate messages and potential infinite loops

export interface ClientData {
  id: string;
  room: string;
}

export interface BroadcastMessage {
  type: "broadcast" | "message" | "join" | "leave";
  room?: string;
  content?: string;
  from?: string;
}

// Track connected clients by room
const rooms = new Map<string, Set<WebSocket<ClientData>>>();
const clients = new Map<WebSocket<ClientData>, ClientData>();

let clientIdCounter = 0;

function generateClientId(): string {
  return `user-${++clientIdCounter}`;
}

export function getRoomClientCount(room: string): number {
  return rooms.get(room)?.size ?? 0;
}

export function resetServer(): void {
  rooms.clear();
  clients.clear();
  clientIdCounter = 0;
}

// BUG: This function sends to ALL clients including the sender
function broadcastToRoom(
  room: string,
  message: BroadcastMessage,
  sender: WebSocket<ClientData>
): number {
  const roomClients = rooms.get(room);
  if (!roomClients) return 0;

  let sentCount = 0;
  for (const client of roomClients) {
    // BUG: Should check `if (client !== sender)` but doesn't!
    // This causes the sender to also receive their own broadcast
    client.send(JSON.stringify(message));
    sentCount++;
  }

  return sentCount;
}

const server = Bun.serve<ClientData>({
  port: 3024,
  fetch(req, server) {
    const url = new URL(req.url);
    const room = url.searchParams.get("room") || "default";

    // Upgrade HTTP request to WebSocket with room data
    if (
      server.upgrade(req, {
        data: {
          id: generateClientId(),
          room: room,
        },
      })
    ) {
      return;
    }
    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      const data = ws.data;
      if (!data) return;

      // Add client to room
      if (!rooms.has(data.room)) {
        rooms.set(data.room, new Set());
      }
      rooms.get(data.room)!.add(ws);
      clients.set(ws, data);

      // Notify client of successful join
      ws.send(
        JSON.stringify({
          type: "join",
          room: data.room,
          clientId: data.id,
        })
      );

      // Broadcast join notification to room (BUG: includes sender)
      broadcastToRoom(
        data.room,
        {
          type: "join",
          from: data.id,
          content: `${data.id} joined the room`,
        },
        ws
      );
    },
    message(ws, message) {
      const data = ws.data;
      if (!data) return;

      try {
        const parsed = JSON.parse(message.toString());

        if (parsed.type === "broadcast" && parsed.content) {
          // BUG: Broadcast includes sender - they'll receive their own message!
          const sentCount = broadcastToRoom(
            data.room,
            {
              type: "message",
              from: data.id,
              content: parsed.content,
            },
            ws
          );

          // Note: sentCount includes sender, which is wrong
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    },
    close(ws) {
      const data = ws.data;
      if (!data) return;

      // Remove from room
      rooms.get(data.room)?.delete(ws);
      clients.delete(ws);

      // Broadcast leave notification (BUG: would include sender if they were still there)
      broadcastToRoom(
        data.room,
        {
          type: "leave",
          from: data.id,
          content: `${data.id} left the room`,
        },
        ws
      );
    },
  },
});

export default server;
