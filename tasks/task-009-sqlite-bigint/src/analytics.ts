import { Database } from "bun:sqlite";

// BUG: Not using { strict: true } to enable BigInt for large integers
const db = new Database(":memory:");

db.run(`
  CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    event_type TEXT NOT NULL,
    timestamp_ns INTEGER NOT NULL,
    user_id INTEGER,
    session_id INTEGER,
    value INTEGER
  )
`);

db.run(`
  CREATE TABLE counters (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    value INTEGER DEFAULT 0
  )
`);

db.run(`
  CREATE TABLE snowflake_ids (
    id INTEGER PRIMARY KEY,
    snowflake_id INTEGER UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

interface EventRecord {
  id: number;
  event_type: string;
  timestamp_ns: number; // BUG: Should be bigint for nanoseconds
  user_id: number | null;
  session_id: number | null;
  value: number | null;
}

// BUG: Nanosecond timestamps exceed MAX_SAFE_INTEGER
export function logEvent(
  eventType: string,
  timestampNs: number | bigint,
  userId?: number | bigint,
  sessionId?: number | bigint,
  value?: number | bigint
): number {
  // Converting bigint to number loses precision!
  const result = db.run(
    "INSERT INTO events (event_type, timestamp_ns, user_id, session_id, value) VALUES (?, ?, ?, ?, ?)",
    [
      eventType,
      Number(timestampNs), // BUG: Precision loss for large values
      userId !== undefined ? Number(userId) : null,
      sessionId !== undefined ? Number(sessionId) : null,
      value !== undefined ? Number(value) : null,
    ]
  );

  return Number(result.lastInsertRowid);
}

// BUG: Returns number instead of bigint for large values
export function getEvent(id: number): EventRecord | null {
  return db.query("SELECT * FROM events WHERE id = ?").get(id) as EventRecord | null;
}

export function getEventsByTimeRange(startNs: number | bigint, endNs: number | bigint): EventRecord[] {
  // BUG: Comparison might fail due to precision loss
  return db.query("SELECT * FROM events WHERE timestamp_ns BETWEEN ? AND ?").all(
    Number(startNs),
    Number(endNs)
  ) as EventRecord[];
}

// BUG: Counter values can exceed MAX_SAFE_INTEGER with heavy use
export function incrementCounter(name: string, amount: number | bigint = 1): number {
  db.run(
    "INSERT INTO counters (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = value + ?",
    [name, Number(amount), Number(amount)]
  );

  const row = db.query("SELECT value FROM counters WHERE name = ?").get(name) as { value: number };
  return row.value; // BUG: Returns number, loses precision for large values
}

export function getCounter(name: string): number | null {
  const row = db.query("SELECT value FROM counters WHERE name = ?").get(name) as
    | { value: number }
    | null;
  return row?.value ?? null;
}

// BUG: Snowflake IDs are 64-bit and will lose precision
export function storeSnowflakeId(snowflakeId: bigint): number {
  const result = db.run("INSERT INTO snowflake_ids (snowflake_id) VALUES (?)", [
    Number(snowflakeId), // BUG: Loses precision for 64-bit IDs
  ]);

  return Number(result.lastInsertRowid);
}

export function getSnowflakeId(id: number): number | null {
  const row = db.query("SELECT snowflake_id FROM snowflake_ids WHERE id = ?").get(id) as
    | { snowflake_id: number }
    | null;
  return row?.snowflake_id ?? null; // BUG: Returns corrupted number
}

export function findBySnowflakeId(snowflakeId: bigint): { id: number } | null {
  // BUG: Query comparison fails because stored value is corrupted
  return db.query("SELECT id FROM snowflake_ids WHERE snowflake_id = ?").get(
    Number(snowflakeId)
  ) as { id: number } | null;
}

// Generate a timestamp in nanoseconds (for testing purposes)
export function nowNanoseconds(): bigint {
  return BigInt(Date.now()) * 1000000n;
}

// Simulate a Snowflake ID generator
export function generateSnowflakeId(): bigint {
  const timestamp = BigInt(Date.now() - 1288834974657); // Discord epoch
  const workerId = 1n;
  const processId = 1n;
  const increment = BigInt(Math.floor(Math.random() * 4096));

  return (timestamp << 22n) | (workerId << 17n) | (processId << 12n) | increment;
}

export function resetAnalytics() {
  db.run("DELETE FROM events");
  db.run("DELETE FROM counters");
  db.run("DELETE FROM snowflake_ids");
}

export { db };
