import { Database } from "bun:sqlite";

const db = new Database(":memory:");
db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");

// BUG: String interpolation instead of parameterized queries
// This is vulnerable to SQL injection and breaks with special characters
export function findUser(email: string) {
  return db.query(`SELECT * FROM users WHERE email = '${email}'`).get();
}

export function findUserByName(name: string) {
  return db.query(`SELECT * FROM users WHERE name = '${name}'`).get();
}

export function addUser(name: string, email: string) {
  db.run(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`);
}

export function updateUserEmail(id: number, newEmail: string) {
  db.run(`UPDATE users SET email = '${newEmail}' WHERE id = ${id}`);
}

export function deleteUser(email: string) {
  db.run(`DELETE FROM users WHERE email = '${email}'`);
}

export function searchUsers(searchTerm: string) {
  return db.query(`SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`).all();
}

export { db };
