// BUG: URL params extracted incorrectly due to off-by-one error in split

// Mock database
const users: Record<string, { id: string; name: string; email: string }> = {
  "1": { id: "1", name: "Alice", email: "alice@example.com" },
  "2": { id: "2", name: "Bob", email: "bob@example.com" },
  "3": { id: "3", name: "Charlie", email: "charlie@example.com" },
};

const posts: Record<string, { id: string; title: string; authorId: string }> = {
  "101": { id: "101", title: "Hello World", authorId: "1" },
  "102": { id: "102", title: "Bun is Fast", authorId: "2" },
  "103": { id: "103", title: "TypeScript Tips", authorId: "1" },
};

const server = Bun.serve({
  port: 3004,
  fetch(req) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    // parts for "/api/users/123" = ["", "api", "users", "123"]
    // Index:                         0     1       2       3

    // Route: GET /api/users/:id
    if (parts[1] === "api" && parts[2] === "users" && parts.length === 4) {
      // BUG: Using index 2 instead of 3 - gets "users" instead of the actual ID
      const userId = parts[2]; // Should be parts[3]

      const user = users[userId];
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json(user);
    }

    // Route: GET /api/posts/:id
    if (parts[1] === "api" && parts[2] === "posts" && parts.length === 4) {
      // BUG: Same off-by-one error
      const postId = parts[2]; // Should be parts[3]

      const post = posts[postId];
      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      return Response.json(post);
    }

    // Route: GET /api/users/:userId/posts/:postId
    if (
      parts[1] === "api" &&
      parts[2] === "users" &&
      parts[4] === "posts" &&
      parts.length === 6
    ) {
      // BUG: Off-by-one errors for both parameters
      const userId = parts[2]; // Should be parts[3]
      const postId = parts[4]; // Should be parts[5]

      const user = users[userId];
      const post = posts[postId];

      if (!user || !post) {
        return Response.json({ error: "Resource not found" }, { status: 404 });
      }

      return Response.json({ user, post });
    }

    return new Response("Not Found", { status: 404 });
  },
});

export default server;
