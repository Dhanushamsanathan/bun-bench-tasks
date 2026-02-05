// BUG: Improper handling of complex data types
// - Dates are not properly formatted
// - JSON objects are not serialized
// - Arrays are not handled correctly

import { SQL } from "bun";

// Use SQLite for testing
const sql = new SQL("sqlite://:memory:");

// Initialize database with various column types
await sql`
  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT,
    metadata TEXT,
    tags TEXT,
    large_number INTEGER
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

// BUG: Date is not properly converted - toString() gives wrong format
export async function createEvent(event: Event): Promise<number> {
  // BUG: Date.toString() produces something like "Tue Jan 14 2025..."
  // which is not a valid SQL date format
  await sql`
    INSERT INTO events (title, event_date, metadata, tags, large_number)
    VALUES (
      ${event.title},
      ${event.event_date},
      ${event.metadata},
      ${event.tags},
      ${event.large_number}
    )
  `;

  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

// BUG: Retrieved data is not properly parsed back to original types
export async function getEvent(id: number): Promise<Event | undefined> {
  const result = await sql`SELECT * FROM events WHERE id = ${id}`;
  const row = result[0];

  if (!row) return undefined;

  // BUG: No parsing - returns raw strings instead of proper types
  return {
    id: row.id,
    title: row.title,
    event_date: row.event_date, // Should be Date, but returns string
    metadata: row.metadata, // Should be object, but returns string
    tags: row.tags, // Should be array, but returns string
    large_number: row.large_number, // May lose precision for large values
  } as unknown as Event;
}

// BUG: Product creation with same issues
export async function createProduct(product: Product): Promise<number> {
  // BUG: Objects become "[object Object]" when interpolated
  // BUG: Dates are not properly formatted
  await sql`
    INSERT INTO products (name, price_cents, attributes, created_at, updated_at)
    VALUES (
      ${product.name},
      ${product.price_cents},
      ${product.attributes},
      ${product.created_at},
      ${product.updated_at}
    )
  `;

  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

// BUG: Product retrieval without type conversion
export async function getProduct(id: number): Promise<Product | undefined> {
  const result = await sql`SELECT * FROM products WHERE id = ${id}`;
  const row = result[0];

  if (!row) return undefined;

  // BUG: Returns raw data without parsing
  return row as unknown as Product;
}

// BUG: Bulk insert with array of objects - not properly serialized
export async function createEvents(events: Event[]): Promise<number[]> {
  const ids: number[] = [];

  for (const event of events) {
    // BUG: Same type conversion issues for each event
    await sql`
      INSERT INTO events (title, event_date, metadata, tags)
      VALUES (
        ${event.title},
        ${event.event_date},
        ${event.metadata},
        ${event.tags}
      )
    `;
    const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
    ids.push(id);
  }

  return ids;
}

// BUG: Query with date range - dates not properly formatted
export async function getEventsBetweenDates(
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  // BUG: Dates are not converted to SQL-compatible format
  const result = await sql`
    SELECT * FROM events
    WHERE event_date >= ${startDate}
    AND event_date <= ${endDate}
  `;

  return result as unknown as Event[];
}

// BUG: Query filtering by JSON property - won't work with wrong format
export async function getEventsByMetadataKey(
  key: string,
  value: string
): Promise<Event[]> {
  // BUG: This assumes metadata is properly stored as JSON
  // but it's actually stored as "[object Object]"
  const result = await sql`
    SELECT * FROM events
    WHERE json_extract(metadata, ${`$.${key}`}) = ${value}
  `;

  return result as unknown as Event[];
}

export async function resetDatabase() {
  await sql`DELETE FROM events`;
  await sql`DELETE FROM products`;
}

export { sql };
