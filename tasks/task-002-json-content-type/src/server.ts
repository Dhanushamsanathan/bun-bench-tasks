// BUG: JSON response is missing Content-Type header
// This causes clients to potentially misinterpret the response format

const server = Bun.serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/user") {
      const userData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      };

      // BUG: Manually stringifying JSON but not setting Content-Type header
      // The response will have text/plain;charset=utf-8 instead of application/json
      return new Response(JSON.stringify(userData));
    }

    if (url.pathname === "/api/items") {
      const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
      ];

      // BUG: Same issue - missing Content-Type header
      return new Response(JSON.stringify(items));
    }

    return new Response("Not Found", { status: 404 });
  },
});

export default server;
