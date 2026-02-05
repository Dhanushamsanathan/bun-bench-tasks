// FIXED: POST handler properly awaits req.json() to get parsed data

const server = Bun.serve({
  port: 3003,
  // FIXED: Made fetch handler async
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/echo" && req.method === "POST") {
      // FIXED: Properly await req.json() to get the actual parsed data
      const body = await req.json();

      return Response.json({
        received: body,
        timestamp: Date.now(),
      });
    }

    if (url.pathname === "/api/users" && req.method === "POST") {
      // FIXED: Await the Promise to get actual user data
      const userData = await req.json();

      // Now userData.name is the actual name string
      const greeting = `Hello, ${userData.name}!`;

      return Response.json({
        message: greeting,
        user: userData,
      });
    }

    if (url.pathname === "/api/calculate" && req.method === "POST") {
      // FIXED: Await req.json() to get actual data
      const data = await req.json();

      // Now data.a and data.b are actual numbers
      const result = data.a + data.b;

      return Response.json({
        result: result,
        input: data,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

export default server;
