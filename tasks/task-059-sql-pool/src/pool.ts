// BUG: Connection pool not properly managed
// - Creates new connections for each operation
// - Reserved connections are not released
// - No proper pool configuration

import { SQL } from "bun";

// BUG: Creating a new SQL instance for every call is inefficient
// But the main bug is in how we handle reserved connections

// Use SQLite for testing (connection management concepts still apply)
const sql = new SQL("sqlite://:memory:");

// Initialize database
await sql`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )
`.simple();

await sql`
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`.simple();

// Simulated connection counter for testing
let activeConnections = 0;
const MAX_CONNECTIONS = 5;

// BUG: Reserved connection is never released!
export async function getUserWithSession(userId: number) {
  activeConnections++;

  if (activeConnections > MAX_CONNECTIONS) {
    throw new Error("Connection pool exhausted");
  }

  // Reserve a connection for multiple queries
  const reserved = await sql.reserve();

  // BUG: No try/finally, no release() call!
  const user = await reserved`SELECT * FROM users WHERE id = ${userId}`;
  const sessions = await reserved`SELECT * FROM sessions WHERE user_id = ${userId}`;

  // Forgot to release the connection!
  // reserved.release() should be called here

  return { user: user[0], sessions };
}

// BUG: Connection leak on error
export async function createUserWithSession(name: string, email: string, token: string) {
  activeConnections++;

  if (activeConnections > MAX_CONNECTIONS) {
    throw new Error("Connection pool exhausted");
  }

  const reserved = await sql.reserve();

  // If this throws, connection is never released!
  const userResult = await reserved`
    INSERT INTO users (name, email) VALUES (${name}, ${email})
  `;
  const [{ id: userId }] = await reserved`SELECT last_insert_rowid() as id`;

  // This might also throw
  await reserved`
    INSERT INTO sessions (user_id, token) VALUES (${userId}, ${token})
  `;

  // Only released on success path, not on error!
  reserved.release();
  activeConnections--;

  return userId;
}

// BUG: Multiple reserved connections without release
export async function batchGetUsers(userIds: number[]) {
  const results = [];

  for (const id of userIds) {
    activeConnections++;

    if (activeConnections > MAX_CONNECTIONS) {
      throw new Error("Connection pool exhausted");
    }

    // BUG: Creating a new reserved connection for each user
    // and never releasing them!
    const reserved = await sql.reserve();
    const user = await reserved`SELECT * FROM users WHERE id = ${id}`;
    results.push(user[0]);
    // No release!
  }

  return results;
}

// BUG: No cleanup on close
export async function cleanupConnections() {
  // This does nothing to fix the leaked connections
  // Should use sql.close() to properly close the pool
}

export async function getActiveConnectionCount() {
  return activeConnections;
}

export async function addUser(name: string, email: string) {
  await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

export async function resetDatabase() {
  await sql`DELETE FROM sessions`;
  await sql`DELETE FROM users`;
  activeConnections = 0;
}

export { sql };
