import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");

// FIXED: Using parameterized queries with ? placeholders
export function findUser(email: string) {
  return db.query("SELECT * FROM users WHERE email = ?").get(email);
}

export function findUserByName(name: string) {
  return db.query("SELECT * FROM users WHERE name = ?").get(name);
}

export function addUser(name: string, email: string) {
  db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
}

export function updateUserEmail(id: number, newEmail: string) {
  db.run("UPDATE users SET email = ? WHERE id = ?", [newEmail, id]);
}

export function deleteUser(email: string) {
  db.run("DELETE FROM users WHERE email = ?", [email]);
}

export function searchUsers(searchTerm: string) {
  // For LIKE queries, use parameter binding and handle wildcards in the value
  const pattern = `%${searchTerm}%`;
  return db.query("SELECT * FROM users WHERE name LIKE ?").all(pattern);
}

// Alternative: Using named parameters with $name syntax
export function findUserNamed(email: string) {
  return db.query("SELECT * FROM users WHERE email = $email").get({ $email: email });
}

export function addUserNamed(name: string, email: string) {
  db.run("INSERT INTO users (name, email) VALUES ($name, $email)", {
    $name: name,
    $email: email,
  });
}

export { db };
