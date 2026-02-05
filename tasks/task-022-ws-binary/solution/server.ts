// FIXED: Binary messages are properly handled without text conversion

export interface BinaryStats {
  type: "binary" | "text";
  length: number;
  checksum: number;
}

function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = (sum + data[i]) % 65536;
  }
  return sum;
}

const server = Bun.serve({
  port: 3022,
  fetch(req, server) {
    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return;
    }
    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
    },
    message(ws, message) {
      // FIXED: Check if message is binary or text
      if (typeof message === "string") {
        // Text message - send back as text
        ws.send(message);
      } else {
        // FIXED: Binary message - send back as binary without conversion
        // message is already a Buffer, send it directly
        ws.send(message);
      }
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

export default server;
