import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.run(`
  CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    mime_type TEXT,
    data TEXT,
    size INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

interface FileRecord {
  id: number;
  name: string;
  mime_type: string | null;
  data: string;
  size: number;
  created_at: string;
}

// BUG: Converting binary data to string corrupts non-UTF8 bytes
export function storeFile(name: string, data: Uint8Array, mimeType?: string): number {
  // BUG: toString() on Uint8Array converts bytes to comma-separated numbers
  // or loses binary data depending on encoding
  const dataString = data.toString();

  const result = db.run(
    "INSERT INTO files (name, mime_type, data, size) VALUES (?, ?, ?, ?)",
    [name, mimeType ?? null, dataString, data.length]
  );

  return Number(result.lastInsertRowid);
}

// BUG: Returns string instead of Uint8Array
export function getFile(id: number): { name: string; data: string; mimeType: string | null } | null {
  const row = db.query("SELECT * FROM files WHERE id = ?").get(id) as FileRecord | undefined;

  if (!row) return null;

  return {
    name: row.name,
    data: row.data, // BUG: This is a corrupted string, not binary data
    mimeType: row.mime_type,
  };
}

// BUG: Attempting to get binary but data is already corrupted
export function getFileBuffer(id: number): Uint8Array | null {
  const row = db.query("SELECT * FROM files WHERE id = ?").get(id) as FileRecord | undefined;

  if (!row) return null;

  // BUG: TextEncoder on a corrupted string doesn't restore original bytes
  return new TextEncoder().encode(row.data);
}

// BUG: String-based comparison will fail for binary data
export function fileExists(name: string, data: Uint8Array): boolean {
  const dataString = data.toString();
  const row = db.query("SELECT id FROM files WHERE name = ? AND data = ?").get(name, dataString);
  return row !== undefined;
}

// BUG: Calculates hash on corrupted string data
export function getFileHash(id: number): string | null {
  const row = db.query("SELECT data FROM files WHERE id = ?").get(id) as { data: string } | undefined;

  if (!row) return null;

  // Hashing the corrupted string, not original binary
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(row.data);
  return hasher.digest("hex");
}

// BUG: Size mismatch - stored size vs actual corrupted data length
export function verifyFileIntegrity(id: number): boolean {
  const row = db.query("SELECT data, size FROM files WHERE id = ?").get(id) as
    | { data: string; size: number }
    | undefined;

  if (!row) return false;

  // BUG: Comparing original size with corrupted string length
  return row.data.length === row.size;
}

export function listFiles(): Array<{ id: number; name: string; size: number }> {
  return db.query("SELECT id, name, size FROM files").all() as Array<{
    id: number;
    name: string;
    size: number;
  }>;
}

export function deleteFile(id: number): boolean {
  const result = db.run("DELETE FROM files WHERE id = ?", [id]);
  return result.changes > 0;
}

export function resetStorage() {
  db.run("DELETE FROM files");
}

export { db };
