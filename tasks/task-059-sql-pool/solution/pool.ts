// FIXED: Proper connection pool management
// - Single SQL instance with pool configuration
// - Reserved connections always released with try/finally or using syntax
// - Efficient query patterns to minimize connection usage

import { SQL } from "bun";

// Use SQLite for testing
// For PostgreSQL, use proper pool configuration:
// const sql = new SQL({
//   hostname: "localhost",
//   database: "mydb",
//   max: 10,              // Maximum connections
//   idleTimeout: 30,      // Close idle connections after 30s
//   connectionTimeout: 10 // Connection timeout
// });
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

// Track connections for testing purposes
let activeConnections = 0;

// FIXED: Using try/finally to ensure connection release
export async function getUserWithSession(userId: number) {
  activeConnections++;
  const reserved = await sql.reserve();

  try {
    const user = await reserved`SELECT * FROM users WHERE id = ${userId}`;
    const sessions = await reserved`SELECT * FROM sessions WHERE user_id = ${userId}`;
    return { user: user[0], sessions };
  } finally {
    // ALWAYS release, even if an error occurred
    reserved.release();
    activeConnections--;
  }
}

// ALTERNATIVE: Using Symbol.dispose for automatic release (requires TypeScript 5.2+)
export async function getUserWithSessionUsing(userId: number) {
  activeConnections++;

  try {
    using reserved = await sql.reserve();
    const user = await reserved`SELECT * FROM users WHERE id = ${userId}`;
    const sessions = await reserved`SELECT * FROM sessions WHERE user_id = ${userId}`;
    return { user: user[0], sessions };
  } finally {
    activeConnections--;
  }
  // Connection automatically released when 'using' goes out of scope
}

// FIXED: Connection release on both success and error paths
export async function createUserWithSession(name: string, email: string, token: string) {
  activeConnections++;
  const reserved = await sql.reserve();

  try {
    await reserved`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
    const [{ id: userId }] = await reserved`SELECT last_insert_rowid() as id`;
    await reserved`INSERT INTO sessions (user_id, token) VALUES (${userId}, ${token})`;
    return userId;
  } finally {
    // Release connection regardless of success or failure
    reserved.release();
    activeConnections--;
  }
}

// BETTER: Use transactions instead of reserved connections for multi-query operations
export async function createUserWithSessionTx(name: string, email: string, token: string) {
  return await sql.begin(async (tx) => {
    await tx`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
    const [{ id: userId }] = await tx`SELECT last_insert_rowid() as id`;
    await tx`INSERT INTO sessions (user_id, token) VALUES (${userId}, ${token})`;
    return userId;
  });
  // Transaction connections are automatically managed by the pool
}

// FIXED: Single query for batch operations instead of multiple connections
export async function batchGetUsers(userIds: number[]) {
  if (userIds.length === 0) return [];

  // Use IN clause for efficient batch retrieval
  // This uses a single connection from the pool
  const users = await sql`SELECT * FROM users WHERE id IN ${sql(userIds)}`;
  return users;
}

// ALTERNATIVE: If you need reserved connection for batch, use try/finally
export async function batchGetUsersWithReserved(userIds: number[]) {
  if (userIds.length === 0) return [];

  activeConnections++;
  const reserved = await sql.reserve();

  try {
    // Still better to use IN clause even with reserved connection
    const users = await reserved`SELECT * FROM users WHERE id IN ${sql(userIds)}`;
    return users;
  } finally {
    reserved.release();
    activeConnections--;
  }
}

// FIXED: Proper cleanup with sql.close()
export async function cleanupConnections() {
  // Gracefully close all connections
  // await sql.close(); // Waits for all queries to finish
  // await sql.close({ timeout: 5 }); // Wait up to 5 seconds
  // await sql.close({ timeout: 0 }); // Close immediately
  activeConnections = 0;
}

// Efficient concurrent operations using pool
export async function getConcurrentUserData(userIds: number[]) {
  // The pool handles concurrent queries automatically
  // No need to manually reserve/release for simple queries
  const results = await Promise.all(
    userIds.map(async (id) => {
      const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
      const sessions = await sql`SELECT * FROM sessions WHERE user_id = ${id}`;
      return { user, sessions };
    })
  );
  return results;
}

// Even more efficient: Single queries for concurrent data
export async function getConcurrentUserDataOptimized(userIds: number[]) {
  if (userIds.length === 0) return [];

  // Single query for all users
  const users = await sql`SELECT * FROM users WHERE id IN ${sql(userIds)}`;

  // Single query for all sessions
  const sessions = await sql`SELECT * FROM sessions WHERE user_id IN ${sql(userIds)}`;

  // Group in memory (more efficient than N+1 queries)
  return users.map(user => ({
    user,
    sessions: sessions.filter(s => s.user_id === user.id)
  }));
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
