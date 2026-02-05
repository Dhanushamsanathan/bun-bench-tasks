import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

test("GET /api/users/:id should return user with correct ID", async () => {
  const res = await fetch("http://localhost:3004/api/users/1");
  const data = await res.json();

  // This test FAILS because buggy code extracts "users" as the ID instead of "1"
  expect(res.status).toBe(200);
  expect(data.id).toBe("1");
  expect(data.name).toBe("Alice");
});

test("GET /api/users/2 should return Bob", async () => {
  const res = await fetch("http://localhost:3004/api/users/2");
  const data = await res.json();

  // This test FAILS - gets 404 because it looks for users["users"]
  expect(res.status).toBe(200);
  expect(data.id).toBe("2");
  expect(data.name).toBe("Bob");
});

test("GET /api/posts/:id should return post with correct ID", async () => {
  const res = await fetch("http://localhost:3004/api/posts/101");
  const data = await res.json();

  // This test FAILS - extracts "posts" instead of "101"
  expect(res.status).toBe(200);
  expect(data.id).toBe("101");
  expect(data.title).toBe("Hello World");
});

test("GET /api/users/:userId/posts/:postId should return both resources", async () => {
  const res = await fetch("http://localhost:3004/api/users/1/posts/101");
  const data = await res.json();

  // This test FAILS - extracts wrong values for both parameters
  expect(res.status).toBe(200);
  expect(data.user.id).toBe("1");
  expect(data.post.id).toBe("101");
});

test("GET /api/users/999 should return 404 for non-existent user", async () => {
  const res = await fetch("http://localhost:3004/api/users/999");

  // This would pass but for the wrong reason - it's finding "users" not "999"
  expect(res.status).toBe(404);
});

test("Different user IDs should return different users", async () => {
  const res1 = await fetch("http://localhost:3004/api/users/1");
  const res2 = await fetch("http://localhost:3004/api/users/2");
  const res3 = await fetch("http://localhost:3004/api/users/3");

  const user1 = await res1.json();
  const user2 = await res2.json();
  const user3 = await res3.json();

  // This test FAILS because all requests extract the same "users" string
  expect(user1.name).not.toBe(user2.name);
  expect(user2.name).not.toBe(user3.name);
});
