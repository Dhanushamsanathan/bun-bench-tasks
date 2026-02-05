// BUG: TCP server doesn't clean up client connections on disconnect
// This causes resource leaks and incorrect connection counts

import type { Socket } from "bun";

export interface ServerData {
  id: number;
  connectedAt: Date;
}

// Track all connected clients
const connections = new Set<Socket<ServerData>>();
let connectionIdCounter = 0;

export function getConnectionCount(): number {
  return connections.size;
}

export function getConnections(): Set<Socket<ServerData>> {
  return connections;
}

export function resetConnections(): void {
  connections.clear();
  connectionIdCounter = 0;
}

const server = Bun.listen<ServerData>({
  hostname: "localhost",
  port: 3051,
  socket: {
    open(socket) {
      // Assign connection data
      socket.data = {
        id: ++connectionIdCounter,
        connectedAt: new Date(),
      };

      // Add to tracked connections
      connections.add(socket);
      console.log(`Client ${socket.data.id} connected. Total: ${connections.size}`);

      // Send welcome message
      socket.write(`Welcome! You are client #${socket.data.id}\n`);
    },

    data(socket, data) {
      // Echo received data back
      const message = typeof data === "string" ? data : data.toString();
      socket.write(`Echo: ${message}`);
    },

    close(socket) {
      // BUG: Not removing socket from connections Set!
      // This causes the connection count to remain high
      console.log(`Client ${socket.data?.id} disconnected.`);
      // Missing: connections.delete(socket);
    },

    error(socket, error) {
      // BUG: Not cleaning up socket on error!
      console.log(`Client ${socket.data?.id} error: ${error.message}`);
      // Missing: connections.delete(socket);
    },

    drain(socket) {
      // Called when socket is ready for more data
    },
  },
});

export default server;
