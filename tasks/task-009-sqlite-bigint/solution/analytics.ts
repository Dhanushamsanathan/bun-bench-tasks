import { Database } from "bun:sqlite";

// FIXED: Enable safeIntegers mode for proper BigInt handling
// When safeIntegers: true, SQLite INTEGER columns return bigint types
// This preserves precision for 64-bit integers (added in Bun v1.1.14)
const db = new Database(":memory:", { safeIntegers: true });

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
  id: number | bigint;
  event_type: string;
  timestamp_ns: bigint; // FIXED: Use bigint for nanoseconds
  user_id: bigint | null;
  session_id: bigint | null;
  value: bigint | null;
}

// FIXED: Accept and store bigint values directly
export function logEvent(
  eventType: string,
  timestampNs: number | bigint,
  userId?: number | bigint,
  sessionId?: number | bigint,
  value?: number | bigint
): number {
  const result = db.run(
    "INSERT INTO events (event_type, timestamp_ns, user_id, session_id, value) VALUES (?, ?, ?, ?, ?)",
    [
      eventType,
      BigInt(timestampNs), // FIXED: Convert to bigint, preserve precision
      userId !== undefined ? BigInt(userId) : null,
      sessionId !== undefined ? BigInt(sessionId) : null,
      value !== undefined ? BigInt(value) : null,
    ]
  );

  return Number(result.lastInsertRowid);
}

// FIXED: Return bigint for large integer columns
export function getEvent(id: number): EventRecord | null {
  return db.query("SELECT * FROM events WHERE id = ?").get(id) as EventRecord | null;
}

export function getEventsByTimeRange(
  startNs: number | bigint,
  endNs: number | bigint
): EventRecord[] {
  // FIXED: Use bigint for comparisons
  return db.query("SELECT * FROM events WHERE timestamp_ns BETWEEN ? AND ?").all(
    BigInt(startNs),
    BigInt(endNs)
  ) as EventRecord[];
}

// FIXED: Return bigint for potentially large counter values
export function incrementCounter(name: string, amount: number | bigint = 1): bigint {
  db.run(
    "INSERT INTO counters (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = value + ?",
    [name, BigInt(amount), BigInt(amount)]
  );

  const row = db.query("SELECT value FROM counters WHERE name = ?").get(name) as { value: bigint };
  return row.value; // FIXED: Returns bigint
}

export function getCounter(name: string): bigint | null {
  const row = db.query("SELECT value FROM counters WHERE name = ?").get(name) as
    | { value: bigint }
    | null;
  return row?.value ?? null;
}

// FIXED: Handle Snowflake IDs as bigint throughout
export function storeSnowflakeId(snowflakeId: bigint): number {
  const result = db.run("INSERT INTO snowflake_ids (snowflake_id) VALUES (?)", [
    snowflakeId, // FIXED: Pass bigint directly
  ]);

  return Number(result.lastInsertRowid);
}

export function getSnowflakeId(id: number): bigint | null {
  const row = db.query("SELECT snowflake_id FROM snowflake_ids WHERE id = ?").get(id) as
    | { snowflake_id: bigint }
    | null;
  return row?.snowflake_id ?? null; // FIXED: Returns bigint
}

export function findBySnowflakeId(snowflakeId: bigint): { id: number | bigint } | null {
  // FIXED: Query with bigint parameter
  return db.query("SELECT id FROM snowflake_ids WHERE snowflake_id = ?").get(snowflakeId) as
    | { id: number | bigint }
    | null;
}

// Generate a timestamp in nanoseconds
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

// Helper: Safely convert number to bigint
export function toBigInt(value: number | bigint | string): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "string") return BigInt(value);
  return BigInt(value);
}

// Helper: Safely convert bigint to number (with warning for unsafe values)
export function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    console.warn(`Warning: Converting unsafe bigint ${value} to number may lose precision`);
  }
  return Number(value);
}

export function resetAnalytics() {
  db.run("DELETE FROM events");
  db.run("DELETE FROM counters");
  db.run("DELETE FROM snowflake_ids");
}

export { db };
