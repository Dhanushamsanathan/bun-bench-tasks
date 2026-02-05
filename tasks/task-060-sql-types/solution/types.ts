// FIXED: Proper handling of complex data types
// - Dates converted to ISO strings for storage, parsed on retrieval
// - JSON objects properly serialized/parsed
// - Arrays handled as JSON strings (or sql.array for PostgreSQL)

import { SQL } from "bun";

// Use SQLite for testing
// For BigInt support with PostgreSQL, use:
// const sql = new SQL({ bigint: true });
const sql = new SQL("sqlite://:memory:");

// Initialize database with various column types
await sql`
  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT,
    metadata TEXT,
    tags TEXT,
    large_number TEXT
  )
`.simple();

await sql`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_cents INTEGER,
    attributes TEXT,
    created_at TEXT,
    updated_at TEXT
  )
`.simple();

export interface Event {
  id?: number;
  title: string;
  event_date: Date;
  metadata: Record<string, unknown>;
  tags: string[];
  large_number?: bigint;
}

export interface Product {
  id?: number;
  name: string;
  price_cents: number;
  attributes: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// FIXED: Proper type conversion before inserting
export async function createEvent(event: Event): Promise<number> {
  await sql`
    INSERT INTO events (title, event_date, metadata, tags, large_number)
    VALUES (
      ${event.title},
      ${event.event_date.toISOString()},
      ${JSON.stringify(event.metadata)},
      ${JSON.stringify(event.tags)},
      ${event.large_number?.toString() ?? null}
    )
  `;

  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

// FIXED: Parse data back to proper types on retrieval
export async function getEvent(id: number): Promise<Event | undefined> {
  const result = await sql`SELECT * FROM events WHERE id = ${id}`;
  const row = result[0];

  if (!row) return undefined;

  return {
    id: row.id,
    title: row.title,
    // FIXED: Parse ISO string back to Date
    event_date: new Date(row.event_date),
    // FIXED: Parse JSON string back to object
    metadata: JSON.parse(row.metadata || "{}"),
    // FIXED: Parse JSON string back to array
    tags: JSON.parse(row.tags || "[]"),
    // FIXED: Parse BigInt from string
    large_number: row.large_number ? BigInt(row.large_number) : undefined,
  };
}

// FIXED: Product creation with proper serialization
export async function createProduct(product: Product): Promise<number> {
  await sql`
    INSERT INTO products (name, price_cents, attributes, created_at, updated_at)
    VALUES (
      ${product.name},
      ${product.price_cents},
      ${JSON.stringify(product.attributes)},
      ${product.created_at.toISOString()},
      ${product.updated_at.toISOString()}
    )
  `;

  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

// FIXED: Product retrieval with proper type conversion
export async function getProduct(id: number): Promise<Product | undefined> {
  const result = await sql`SELECT * FROM products WHERE id = ${id}`;
  const row = result[0];

  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    price_cents: row.price_cents,
    attributes: JSON.parse(row.attributes || "{}"),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

// FIXED: Bulk insert with proper type handling
export async function createEvents(events: Event[]): Promise<number[]> {
  const ids: number[] = [];

  for (const event of events) {
    await sql`
      INSERT INTO events (title, event_date, metadata, tags)
      VALUES (
        ${event.title},
        ${event.event_date.toISOString()},
        ${JSON.stringify(event.metadata)},
        ${JSON.stringify(event.tags)}
      )
    `;
    const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
    ids.push(id);
  }

  return ids;
}

// FIXED: Query with proper date formatting
export async function getEventsBetweenDates(
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  const result = await sql`
    SELECT * FROM events
    WHERE event_date >= ${startDate.toISOString()}
    AND event_date <= ${endDate.toISOString()}
  `;

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    event_date: new Date(row.event_date),
    metadata: JSON.parse(row.metadata || "{}"),
    tags: JSON.parse(row.tags || "[]"),
  }));
}

// FIXED: JSON path queries work with properly stored JSON
export async function getEventsByMetadataKey(
  key: string,
  value: string
): Promise<Event[]> {
  const result = await sql`
    SELECT * FROM events
    WHERE json_extract(metadata, ${`$.${key}`}) = ${value}
  `;

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    event_date: new Date(row.event_date),
    metadata: JSON.parse(row.metadata || "{}"),
    tags: JSON.parse(row.tags || "[]"),
  }));
}

// Helper function for type-safe row mapping
function mapEventRow(row: Record<string, unknown>): Event {
  return {
    id: row.id as number,
    title: row.title as string,
    event_date: new Date(row.event_date as string),
    metadata: JSON.parse((row.metadata as string) || "{}"),
    tags: JSON.parse((row.tags as string) || "[]"),
    large_number: row.large_number ? BigInt(row.large_number as string) : undefined,
  };
}

// Alternative: Using sql() helper for object insertion (PostgreSQL style)
// This is for PostgreSQL with proper column types
export async function createEventPostgres(event: Event): Promise<number> {
  // For PostgreSQL with proper JSONB and ARRAY types:
  // const data = {
  //   title: event.title,
  //   event_date: event.event_date, // PostgreSQL handles Date objects
  //   metadata: event.metadata,     // Automatically converts to JSONB
  //   tags: sql.array(event.tags),  // Uses ARRAY type
  // };
  // await sql`INSERT INTO events ${sql(data)}`;

  // For SQLite, we still need manual serialization
  await sql`
    INSERT INTO events (title, event_date, metadata, tags)
    VALUES (
      ${event.title},
      ${event.event_date.toISOString()},
      ${JSON.stringify(event.metadata)},
      ${JSON.stringify(event.tags)}
    )
  `;

  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

// PostgreSQL array example (for reference)
// export async function createEventWithArrays(title: string, tags: string[]) {
//   // sql.array() creates proper PostgreSQL array literals
//   await sql`INSERT INTO events (title, tags) VALUES (${title}, ${sql.array(tags)})`;
// }

export async function resetDatabase() {
  await sql`DELETE FROM events`;
  await sql`DELETE FROM products`;
}

export { sql };
