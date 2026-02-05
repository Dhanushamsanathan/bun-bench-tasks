// BUG: Message handler doesn't parse JSON, sends raw string back
// This causes clients expecting JSON responses to receive unparsed strings

export interface WebSocketMessage {
  action: string;
  data: string;
}

export interface WebSocketResponse {
  status: string;
  action: string;
  result: string;
}

const server = Bun.serve({
  port: 3021,
  fetch(req, server) {
    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return; // Upgrade successful
    }
    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
    },
    message(ws, message) {
      // BUG: Not parsing the JSON message!
      // The message is a JSON string like '{"action": "echo", "data": "hello"}'
      // but we're treating it as a raw string and sending it back directly

      // BUG: Sending the raw message back without parsing or processing
      ws.send(message);
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

export default server;
