import { Database } from "bun:sqlite";

const db = new Database(":memory:");

// FIXED: Using BLOB type for binary data column
db.run(`
  CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    mime_type TEXT,
    data BLOB,
    size INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

interface FileRecord {
  id: number;
  name: string;
  mime_type: string | null;
  data: Uint8Array;
  size: number;
  created_at: string;
}

// FIXED: Store Uint8Array directly - SQLite handles it as BLOB
export function storeFile(name: string, data: Uint8Array, mimeType?: string): number {
  // Pass Uint8Array directly - bun:sqlite properly stores it as BLOB
  const result = db.run(
    "INSERT INTO files (name, mime_type, data, size) VALUES (?, ?, ?, ?)",
    [name, mimeType ?? null, data, data.length]
  );

  return Number(result.lastInsertRowid);
}

// FIXED: Return Uint8Array for binary data
export function getFile(
  id: number
): { name: string; data: Uint8Array; mimeType: string | null } | null {
  const row = db.query("SELECT * FROM files WHERE id = ?").get(id) as FileRecord | undefined;

  if (!row) return null;

  return {
    name: row.name,
    data: row.data, // Now properly returns Uint8Array
    mimeType: row.mime_type,
  };
}

// FIXED: Data is already Uint8Array from the query
export function getFileBuffer(id: number): Uint8Array | null {
  const row = db.query("SELECT data FROM files WHERE id = ?").get(id) as
    | { data: Uint8Array }
    | undefined;

  return row?.data ?? null;
}

// FIXED: Binary comparison works correctly with BLOB
export function fileExists(name: string, data: Uint8Array): boolean {
  const row = db.query("SELECT id FROM files WHERE name = ? AND data = ?").get(name, data);
  return row !== undefined;
}

// FIXED: Hash the actual binary data
export function getFileHash(id: number): string | null {
  const row = db.query("SELECT data FROM files WHERE id = ?").get(id) as
    | { data: Uint8Array }
    | undefined;

  if (!row) return null;

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(row.data);
  return hasher.digest("hex");
}

// FIXED: Size comparison works correctly with BLOB
export function verifyFileIntegrity(id: number): boolean {
  const row = db.query("SELECT data, size FROM files WHERE id = ?").get(id) as
    | { data: Uint8Array; size: number }
    | undefined;

  if (!row) return false;

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

// Helper: Convert Buffer to Uint8Array if needed (for Node.js compatibility)
export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

// Helper: Read file as binary and store
export async function storeFileFromPath(
  filePath: string,
  name?: string,
  mimeType?: string
): Promise<number> {
  const file = Bun.file(filePath);
  const data = new Uint8Array(await file.arrayBuffer());
  const fileName = name ?? filePath.split("/").pop() ?? "unknown";
  return storeFile(fileName, data, mimeType ?? file.type);
}

export function resetStorage() {
  db.run("DELETE FROM files");
}

export { db };
