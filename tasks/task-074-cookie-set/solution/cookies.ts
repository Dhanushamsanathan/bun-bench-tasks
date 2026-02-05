// FIXED: Uses Bun.Cookie for proper serialization with all security attributes

export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export function serializeCookie(options: CookieOptions): string {
  const { name, value, maxAge, path, domain, secure, httpOnly, sameSite } =
    options;

  // FIXED: Use Bun.Cookie for proper serialization with all attributes
  const cookie = new Bun.Cookie(name, value, {
    maxAge,
    path,
    domain,
    secure,
    httpOnly,
    sameSite,
  });

  return cookie.serialize();
}

export function createSecureSessionCookie(sessionId: string): string {
  // FIXED: All security options are now properly serialized
  return serializeCookie({
    name: "session",
    value: sessionId,
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 86400, // 1 day
  });
}

export function setResponseCookie(
  response: Response,
  options: CookieOptions
): Response {
  const cookieHeader = serializeCookie(options);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookieHeader);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Example usage
if (import.meta.main) {
  const cookie = createSecureSessionCookie("abc123xyz");
  console.log("Set-Cookie:", cookie);
  // Correct output: "session=abc123xyz; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Strict"
}
