// BUG: UDP socket doesn't properly bind to port or handle messages
// This causes communication failures and lost messages

export interface UdpMessage {
  data: string;
  senderAddress?: string;
  senderPort?: number;
}

export interface UdpSocketOptions {
  port: number;
  onMessage?: (message: UdpMessage) => void;
  onError?: (error: Error) => void;
}

export interface UdpSocketResult {
  socket: Awaited<ReturnType<typeof Bun.udpSocket>>;
  port: number;
  send: (message: string, address: string, port: number) => void;
  close: () => void;
  getReceivedMessages: () => UdpMessage[];
}

const receivedMessages: UdpMessage[] = [];

export async function createUdpSocket(options: UdpSocketOptions): Promise<UdpSocketResult> {
  const { port, onMessage, onError } = options;

  // BUG: Not specifying the port correctly in the socket configuration
  // This causes the socket to bind to a random port
  const socket = await Bun.udpSocket({
    // BUG: Missing 'port' property - socket binds to random port
    socket: {
      data(socket, buf, port, addr) {
        // BUG: Not properly extracting sender information
        // The callback receives (socket, buf, port, addr) but we're ignoring port and addr
        const message: UdpMessage = {
          data: buf.toString(),
          // BUG: Not storing senderAddress and senderPort from the callback parameters
        };

        receivedMessages.push(message);
        onMessage?.(message);
      },

      error(socket, error) {
        onError?.(error);
      },
    },
  });

  return {
    socket,
    // BUG: Returning the requested port, not the actual bound port
    port: port, // Should be socket.port
    send: (message: string, address: string, targetPort: number) => {
      // BUG: Using hardcoded port instead of parameter
      socket.send(message, targetPort, address);
    },
    close: () => {
      socket.close();
    },
    getReceivedMessages: () => [...receivedMessages],
  };
}

export function clearReceivedMessages(): void {
  receivedMessages.length = 0;
}

// Echo server example
export async function startEchoServer(port: number): Promise<UdpSocketResult> {
  const result = await createUdpSocket({
    port,
    onMessage: (msg) => {
      console.log(`Received: ${msg.data} from ${msg.senderAddress}:${msg.senderPort}`);
      // BUG: Can't echo back because we don't have sender info
      if (msg.senderAddress && msg.senderPort) {
        result.send(`Echo: ${msg.data}`, msg.senderAddress, msg.senderPort);
      }
    },
  });

  return result;
}
