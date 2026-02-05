// BUG: TCP client doesn't handle connection errors properly
// This causes crashes and unhandled promise rejections

export interface ClientOptions {
  hostname: string;
  port: number;
  timeout?: number;
  onConnect?: () => void;
  onData?: (data: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface ClientResult {
  success: boolean;
  error?: Error;
  socket?: ReturnType<typeof Bun.connect> extends Promise<infer T> ? T : never;
}

export async function createTcpClient(options: ClientOptions): Promise<ClientResult> {
  const { hostname, port, onConnect, onData, onError, onClose } = options;

  // BUG: No try-catch around Bun.connect()
  // BUG: No timeout handling
  // BUG: Error callback in socket handlers is empty

  const socket = await Bun.connect({
    hostname,
    port,
    socket: {
      open(socket) {
        onConnect?.();
      },

      data(socket, data) {
        const message = typeof data === "string" ? data : data.toString();
        onData?.(message);
      },

      close(socket) {
        onClose?.();
      },

      error(socket, error) {
        // BUG: Not calling onError callback!
        // The error is silently ignored
        console.log("Socket error occurred");
      },

      connectError(socket, error) {
        // BUG: Not calling onError callback!
        // Connection errors are silently ignored
        console.log("Connect error occurred");
      },
    },
  });

  return {
    success: true,
    socket,
  };
}

// Example usage (will fail if no server is running)
export async function connectToServer(): Promise<void> {
  const result = await createTcpClient({
    hostname: "localhost",
    port: 3052,
    onConnect: () => console.log("Connected!"),
    onData: (data) => console.log("Received:", data),
    onError: (error) => console.log("Error:", error.message),
    onClose: () => console.log("Disconnected"),
  });

  if (result.success && result.socket) {
    result.socket.write("Hello, Server!");
  }
}
