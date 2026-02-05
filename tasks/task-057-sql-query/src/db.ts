// BUG: Uses string concatenation with sql.unsafe() instead of parameterized queries
// This is vulnerable to SQL injection and breaks with special characters

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

// BUG: String concatenation makes this vulnerable to SQL injection
export async function findUser(email: string) {
  // WRONG: Using sql.unsafe with string interpolation
  const result = await sql.unsafe(`SELECT * FROM users WHERE email = '${email}'`);
  return result[0];
}

export async function findUserByName(name: string) {
  // WRONG: Using sql.unsafe with string interpolation
  const result = await sql.unsafe(`SELECT * FROM users WHERE name = '${name}'`);
  return result[0];
}

export async function addUser(name: string, email: string) {
  // WRONG: Using sql.unsafe with string interpolation
  await sql.unsafe(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`);
}

export async function updateUserEmail(id: number, newEmail: string) {
  // WRONG: Using sql.unsafe with string interpolation
  await sql.unsafe(`UPDATE users SET email = '${newEmail}' WHERE id = ${id}`);
}

export async function deleteUser(email: string) {
  // WRONG: Using sql.unsafe with string interpolation
  await sql.unsafe(`DELETE FROM users WHERE email = '${email}'`);
}

export async function searchUsers(searchTerm: string) {
  // WRONG: Using sql.unsafe with string interpolation in LIKE clause
  const result = await sql.unsafe(
    `SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`
  );
  return result;
}

export async function resetDatabase() {
  await sql`DELETE FROM users`;
}

export { sql };
