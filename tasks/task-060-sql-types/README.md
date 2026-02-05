# Task 060: SQL Type Conversion

## Problem Description

The database module incorrectly handles complex data types when inserting and retrieving data. Dates are stored as strings without proper parsing, JSON objects are not properly serialized, and arrays are handled incorrectly, leading to data corruption and type mismatches.

## Bug Location

- `src/types.ts`: Improper handling of dates, JSON, and arrays when interacting with the database

## Expected Behavior

- Dates should be properly converted to/from JavaScript Date objects
- JSON data should be automatically serialized when inserting and parsed when retrieving
- Arrays should be properly handled using `sql.array()` for PostgreSQL-style arrays
- BigInt values should be handled correctly for large numbers

## Actual Behavior

- Dates are stored as raw strings like "[object Date]"
- JSON objects are inserted as "[object Object]"
- Arrays are not properly formatted for SQL
- Large numbers lose precision

## How to Test

```bash
bun test
```

## Files

- `src/types.ts` - Buggy implementation with type conversion errors
- `test/types.test.ts` - Tests that demonstrate type conversion failures
- `solution/types.ts` - Fixed implementation with proper type handling

## Bun.sql Type Handling Reference

```ts
import { sql, SQL } from "bun";

// Dates - use ISO string or proper SQL format
await sql`INSERT INTO events (date) VALUES (${date.toISOString()})`;

// JSON - stringify before inserting
await sql`INSERT INTO data (meta) VALUES (${JSON.stringify(obj)})`;

// Arrays (PostgreSQL) - use sql.array()
await sql`INSERT INTO tags (items) VALUES (${sql.array(["a", "b", "c"])})`;

// BigInt - enable bigint option
const sql = new SQL({ bigint: true });
const [{ large_num }] = await sql`SELECT 9223372036854775807 as large_num`;
// large_num is BigInt
```
