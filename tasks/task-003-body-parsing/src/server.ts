// BUG: POST handler doesn't await req.json(), returns Promise object instead of data

const server = Bun.serve({
  port: 3003,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/echo" && req.method === "POST") {
      // BUG: Missing 'await' - req.json() returns a Promise
      // This means 'body' is a Promise object, not the actual parsed data
      const body = req.json();

      // BUG: This will return { received: Promise } not the actual data
      return Response.json({
        received: body,
        timestamp: Date.now(),
      });
    }

    if (url.pathname === "/api/users" && req.method === "POST") {
      // BUG: Same issue - not awaiting the Promise
      const userData = req.json();

      // BUG: userData.name will be undefined because userData is a Promise
      const greeting = `Hello, ${userData.name}!`;

      return Response.json({
        message: greeting,
        user: userData,
      });
    }

    if (url.pathname === "/api/calculate" && req.method === "POST") {
      // BUG: Not awaiting req.json()
      const data = req.json();

      // BUG: data.a and data.b will be undefined
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
