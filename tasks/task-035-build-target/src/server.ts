// Server code using Bun-specific APIs
// This requires target: "bun" to work correctly

export interface ServerConfig {
  port: number;
  hostname: string;
}

export async function readConfigFile(path: string): Promise<object> {
  // Bun-specific API: Bun.file()
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    return { error: "Config file not found" };
  }

  const content = await file.text();
  return JSON.parse(content);
}

export function createServer(config: ServerConfig) {
  // Bun-specific API: Bun.serve()
  const server = Bun.serve({
    port: config.port,
    hostname: config.hostname,
    fetch(request) {
      const url = new URL(request.url);

      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname === "/info") {
        // Bun-specific: Bun.version
        return new Response(
          JSON.stringify({
            runtime: "bun",
            version: Bun.version,
            revision: Bun.revision,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  return server;
}

export async function hashPassword(password: string): Promise<string> {
  // Bun-specific API: Bun.password
  return await Bun.password.hash(password);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Bun-specific API: Bun.password
  return await Bun.password.verify(password, hash);
}

export function sleepSync(ms: number): void {
  // Bun-specific API: Bun.sleepSync
  Bun.sleepSync(ms);
}

export async function writeOutput(path: string, data: string): Promise<void> {
  // Bun-specific API: Bun.write
  await Bun.write(path, data);
}

// Markers to detect if Bun APIs are available
export const BUN_FILE_MARKER = typeof Bun !== "undefined" && typeof Bun.file === "function";
export const BUN_SERVE_MARKER = typeof Bun !== "undefined" && typeof Bun.serve === "function";
export const BUN_VERSION_MARKER = typeof Bun !== "undefined" && typeof Bun.version === "string";
