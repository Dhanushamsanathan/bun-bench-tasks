// FIXED: Auth check happens before upgrade in fetch handler

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

    // Check for WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade");
    if (upgradeHeader?.toLowerCase() === "websocket") {
      // FIXED: Check authentication BEFORE upgrading
      const token = url.searchParams.get("token") || req.headers.get("Authorization")?.replace("Bearer ", "");

      // Record auth attempt in fetch stage (correct!)
      authAttempts.push({
        token: token,
        success: isValidToken(token),
        stage: "fetch", // FIXED: Auth happens in fetch stage
      });

      // FIXED: Validate token before upgrade
      if (!isValidToken(token)) {
        // Return 401 Unauthorized - no WebSocket connection established
        return new Response(JSON.stringify({ error: "Unauthorized", message: "Invalid or missing token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Token is valid - get user info
      const userId = getUserFromToken(token!);

      // FIXED: Only upgrade authenticated requests
      if (
        server.upgrade(req, {
          data: {
            userId: userId!,
            authenticated: true,
          },
        })
      ) {
        return;
      }

      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    return new Response("WebSocket server running", { status: 200 });
  },
  websocket: {
    open(ws) {
      // At this point, we know the client is authenticated
      // because we checked in fetch handler before upgrade

      connectedClients.set(ws, ws.data);

      ws.send(
        JSON.stringify({
          type: "authenticated",
          message: "Successfully authenticated and connected",
          userId: ws.data.userId,
        })
      );
    },
    message(ws, message) {
      // All clients reaching here are authenticated
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
