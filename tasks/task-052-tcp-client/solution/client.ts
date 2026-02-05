// FIXED: TCP client properly handles connection errors and timeouts

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
  const { hostname, port, timeout = 5000, onConnect, onData, onError, onClose } = options;

  // FIXED: Track connection state
  let connected = false;
  let connectionError: Error | undefined;

  // FIXED: Create a promise that resolves when connected or rejects on error
  return new Promise<ClientResult>((resolve) => {
    // FIXED: Set up timeout handling
    const timeoutId = setTimeout(() => {
      if (!connected) {
        const error = new Error(`Connection timeout after ${timeout}ms`);
        connectionError = error;
        onError?.(error);
        resolve({
          success: false,
          error,
        });
      }
    }, timeout);

    // FIXED: Wrap Bun.connect in try-catch
    try {
      Bun.connect({
        hostname,
        port,
        socket: {
          open(socket) {
            connected = true;
            clearTimeout(timeoutId);
            onConnect?.();
            resolve({
              success: true,
              socket,
            });
          },

          data(socket, data) {
            const message = typeof data === "string" ? data : data.toString();
            onData?.(message);
          },

          close(socket) {
            onClose?.();
          },

          error(socket, error) {
            // FIXED: Call onError callback with the error
            onError?.(error);
          },

          connectError(socket, error) {
            // FIXED: Handle connection errors properly
            clearTimeout(timeoutId);
            if (!connected && !connectionError) {
              connectionError = error;
              onError?.(error);
              resolve({
                success: false,
                error,
              });
            }
          },
        },
      }).catch((error) => {
        // FIXED: Handle promise rejection from Bun.connect
        clearTimeout(timeoutId);
        if (!connected && !connectionError) {
          connectionError = error;
          onError?.(error);
          resolve({
            success: false,
            error,
          });
        }
      });
    } catch (error) {
      // FIXED: Handle synchronous errors
      clearTimeout(timeoutId);
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      resolve({
        success: false,
        error: err,
      });
    }
  });
}

// Example usage (will handle errors gracefully)
export async function connectToServer(): Promise<void> {
  const result = await createTcpClient({
    hostname: "localhost",
    port: 3052,
    timeout: 3000,
    onConnect: () => console.log("Connected!"),
    onData: (data) => console.log("Received:", data),
    onError: (error) => console.log("Error:", error.message),
    onClose: () => console.log("Disconnected"),
  });

  if (result.success && result.socket) {
    result.socket.write("Hello, Server!");
  } else {
    console.log("Failed to connect:", result.error?.message);
  }
}
