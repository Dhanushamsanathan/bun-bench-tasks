// BUG: Auth check happens after upgrade, not before
// This allows unauthorized clients to temporarily connect

export interface ClientData {
  userId: string;
  authenticated: boolean;
}

// Simulated valid tokens (in real app, would verify JWT or session)
const validTokens = new Map<string, string>([
  ["token-abc123", "user-1"],
  ["token-def456", "user-2"],
  ["token-ghi789", "user-3"],
]);

// Track authentication attempts for testing
export const authAttempts: Array<{
  token: string | null;
  success: boolean;
  stage: "fetch" | "open";
}> = [];

// Track connected clients
export const connectedClients = new Map<WebSocket<ClientData>, ClientData>();

export function resetServer(): void {
  authAttempts.length = 0;
  connectedClients.clear();
}

export function isValidToken(token: string | null): boolean {
  return token !== null && validTokens.has(token);
}

export function getUserFromToken(token: string): string | null {
  return validTokens.get(token) ?? null;
}

const server = Bun.serve<ClientData>({
  port: 3025,
  fetch(req, server) {
    const url = new URL(req.url);

    // API endpoint for testing
    if (url.pathname === "/api/auth-attempts") {
      return new Response(JSON.stringify(authAttempts), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // BUG: Not checking authentication BEFORE upgrade!
    // The upgrade happens regardless of auth status
    // This allows any client to establish a WebSocket connection

    // BUG: Just upgrading without any auth check in fetch handler
    if (
      server.upgrade(req, {
        data: {
          userId: "",
          authenticated: false,
        },
      })
    ) {
      return;
    }

    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      // BUG: Auth check is done here, AFTER the connection is already established!
      // The client already has a WebSocket connection at this point

      // Get the request URL to extract token (this is a workaround, not clean)
      // In Bun, we'd need to pass data through upgrade
      const url = ws.data;

      // Since we can't easily get the original request in open handler,
      // we'll simulate checking a token passed via query string
      // But this is already too late - connection is established!

      // BUG: Even if we kick them out here, they were briefly connected
      // Record that auth check happened in 'open' stage (wrong!)
      const token = null; // Can't easily get token here in buggy version
      authAttempts.push({
        token: token,
        success: false,
        stage: "open", // BUG: Auth should happen in 'fetch' stage
      });

      // BUG: Even closing here, the connection was established
      // Sensitive initial data could have been leaked
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "Connection established (auth pending...)",
        })
      );

      // Simulate late auth check
      if (!ws.data.authenticated) {
        // Close with unauthorized reason - but connection was already made!
        ws.close(4001, "Unauthorized");
        return;
      }

      connectedClients.set(ws, ws.data);
    },
    message(ws, message) {
      if (!ws.data.authenticated) {
        ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
        return;
      }

      ws.send(
        JSON.stringify({
          type: "message",
          data: message.toString(),
          userId: ws.data.userId,
        })
      );
    },
    close(ws) {
      connectedClients.delete(ws);
    },
  },
});

export default server;
