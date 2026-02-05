// FIXED: Using Response.json() which automatically sets Content-Type header

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

      // FIXED: Use Response.json() which automatically sets Content-Type: application/json
      return Response.json(userData);
    }

    if (url.pathname === "/api/items") {
      const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
      ];

      // FIXED: Use Response.json() for proper Content-Type header
      return Response.json(items);
    }

    return new Response("Not Found", { status: 404 });
  },
});

export default server;
