// FIXED: Error handler returns appropriate status codes (400, 500, etc.)

// Custom error class for validation errors (400 Bad Request)
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

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
          throw new ValidationError("Invalid numbers provided");
        }

        if (b === 0) {
          throw new ValidationError("Division by zero");
        }

        return Response.json({ result: a / b });
      }

      // Route that throws on missing data
      if (url.pathname === "/api/process" && req.method === "POST") {
        const body = await req.json();

        if (!body.data) {
          throw new ValidationError("Missing required field: data");
        }

        return Response.json({ processed: body.data.toUpperCase() });
      }

      // Route that simulates database error
      if (url.pathname === "/api/db-error") {
        throw new Error("Database connection failed");
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      // FIXED: Determine appropriate status code based on error type
      const isValidationError =
        error instanceof ValidationError ||
        (error instanceof Error &&
          (error.message.includes("Invalid") ||
            error.message.includes("Missing") ||
            error.message.includes("Division by zero")));

      const statusCode = isValidationError ? 400 : 500;

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          headers: { "Content-Type": "application/json" },
          // FIXED: Set proper error status code
          status: statusCode,
        }
      );
    }
  },
});

export default server;
