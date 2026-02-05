// FIXED: Uses Buffer.byteLength() to get actual byte count for Content-Length header

const server = Bun.serve({
  port: 3001,
  fetch(req) {
    const body = "こんにちは"; // 5 chars but 15 bytes in UTF-8
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // FIXED: Use Buffer.byteLength() to get the actual byte count
        "Content-Length": String(Buffer.byteLength(body, "utf-8")),
      },
    });
  },
});

export default server;
