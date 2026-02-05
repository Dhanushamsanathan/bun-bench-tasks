// FIXED: UDP socket properly binds to port and handles messages with sender info

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

  // FIXED: Properly specify the port in socket configuration
  const socket = await Bun.udpSocket({
    // FIXED: Specify port to bind to (0 means system assigns available port)
    port: port,
    socket: {
      data(socket, buf, port, addr) {
        // FIXED: Properly extract sender information from callback parameters
        // The callback signature is: data(socket, buf, port, addr)
        const message: UdpMessage = {
          data: buf.toString(),
          // FIXED: Include sender address and port from callback params
          senderAddress: addr,
          senderPort: port,
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
    // FIXED: Return actual bound port from socket
    port: socket.port,
    send: (message: string, address: string, targetPort: number) => {
      // FIXED: Use the correct parameter order for send
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
  let result: UdpSocketResult;

  result = await createUdpSocket({
    port,
    onMessage: (msg) => {
      console.log(`Received: ${msg.data} from ${msg.senderAddress}:${msg.senderPort}`);
      // FIXED: Now we have sender info, so we can echo back
      if (msg.senderAddress && msg.senderPort) {
        result.send(`Echo: ${msg.data}`, msg.senderAddress, msg.senderPort);
      }
    },
  });

  return result;
}
