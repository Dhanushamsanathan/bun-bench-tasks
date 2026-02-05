// FIXED: Message handler properly parses JSON and responds with processed result

export interface WebSocketMessage {
  action: string;
  data: string;
}

export interface WebSocketResponse {
  status: string;
  action?: string;
  result?: string;
  message?: string;
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
      // FIXED: Parse the JSON message
      try {
        const messageStr = typeof message === "string" ? message : message.toString();
        const parsed: WebSocketMessage = JSON.parse(messageStr);

        // Process based on action
        let result: string;
        switch (parsed.action) {
          case "echo":
            result = parsed.data;
            break;
          case "UPPERCASE":
            result = parsed.data.toUpperCase();
            break;
          case "reverse":
            result = parsed.data.split("").reverse().join("");
            break;
          default:
            result = parsed.data;
        }

        // FIXED: Send properly formatted JSON response
        const response: WebSocketResponse = {
          status: "ok",
          action: parsed.action,
          result: result,
        };
        ws.send(JSON.stringify(response));
      } catch (error) {
        // FIXED: Handle invalid JSON with error response
        const errorResponse: WebSocketResponse = {
          status: "error",
          message: "Invalid JSON message",
        };
        ws.send(JSON.stringify(errorResponse));
      }
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

export default server;
