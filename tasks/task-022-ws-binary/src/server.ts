// BUG: Binary messages are treated as text, corrupting the data
// This causes binary data (images, files, raw bytes) to be corrupted

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
      // BUG: Always treating message as text by converting to string!
      // This corrupts binary data because non-UTF8 bytes get mangled

      // BUG: Converting binary to string loses data integrity
      const textMessage = message.toString();

      // BUG: Sending back as text string, not binary
      ws.send(textMessage);
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

export default server;
