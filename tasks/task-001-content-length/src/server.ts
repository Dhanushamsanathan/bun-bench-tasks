// BUG: Uses string length instead of byte length for Content-Length header
// This causes incorrect Content-Length for multi-byte UTF-8 characters

const server = Bun.serve({
  port: 3001,
  fetch(req) {
    const body = "こんにちは"; // 5 chars but 15 bytes in UTF-8
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // BUG: body.length returns character count (5), not byte count (15)
        "Content-Length": String(body.length),
      },
    });
  },
});

export default server;
