// FIXED: Uses Bun.sql tagged template literals for automatic parameterization
// Values are safely escaped, preventing SQL injection

import { SQL } from "bun";

// Use SQLite for testing (no external database needed)
const sql = new SQL("sqlite://:memory:");

// Initialize database
await sql`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )
`.simple();

// FIXED: Using tagged template literal for automatic parameterization
export async function findUser(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result[0];
}

export async function findUserByName(name: string) {
  const result = await sql`SELECT * FROM users WHERE name = ${name}`;
  return result[0];
}

export async function addUser(name: string, email: string) {
  await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
}

export async function updateUserEmail(id: number, newEmail: string) {
  await sql`UPDATE users SET email = ${newEmail} WHERE id = ${id}`;
}

export async function deleteUser(email: string) {
  await sql`DELETE FROM users WHERE email = ${email}`;
}

export async function searchUsers(searchTerm: string) {
  // For LIKE queries, build the pattern with the wildcard in the value
  const pattern = `%${searchTerm}%`;
  const result = await sql`SELECT * FROM users WHERE name LIKE ${pattern}`;
  return result;
}

// Alternative: Using the sql() helper for object insertion
export async function addUserWithObject(user: { name: string; email: string }) {
  await sql`INSERT INTO users ${sql(user)}`;
}

// Alternative: Using the sql() helper for bulk insert
export async function addUsersInBulk(users: Array<{ name: string; email: string }>) {
  await sql`INSERT INTO users ${sql(users)}`;
}

export async function resetDatabase() {
  await sql`DELETE FROM users`;
}

export { sql };
