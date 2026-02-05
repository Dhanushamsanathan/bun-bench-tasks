// BUG: Error handler returns 200 status code instead of appropriate error codes

const server = Bun.serve({
  port: 3005,
  async fetch(req) {
    const url = new URL(req.url);

    try {
      // Route that intentionally throws an error
      if (url.pathname === "/api/crash") {
        throw new Error("Something went terribly wrong!");
      }

      // Route that throws on invalid input
      if (url.pathname === "/api/divide") {
        const a = Number(url.searchParams.get("a"));
        const b = Number(url.searchParams.get("b"));

        if (isNaN(a) || isNaN(b)) {
          throw new Error("Invalid numbers provided");
        }

        if (b === 0) {
          throw new Error("Division by zero");
        }

        return Response.json({ result: a / b });
      }

      // Route that throws on missing data
      if (url.pathname === "/api/process" && req.method === "POST") {
        const body = await req.json();

        if (!body.data) {
          throw new Error("Missing required field: data");
        }

        return Response.json({ processed: body.data.toUpperCase() });
      }

      // Route that simulates database error
      if (url.pathname === "/api/db-error") {
        throw new Error("Database connection failed");
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      // BUG: Not setting status code - defaults to 200 OK
      // This makes it impossible for clients to detect errors from status
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          headers: { "Content-Type": "application/json" },
          // BUG: Missing status: 500 (or appropriate error code)
        }
      );
    }
  },
});

export default server;
