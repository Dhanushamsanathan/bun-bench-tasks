# Task 059: SQL Connection Pool Management

## Problem Description

The database module creates new SQL connections for each operation instead of properly utilizing Bun.sql's built-in connection pooling. When using reserved connections, the connections are not released back to the pool, causing connection exhaustion under concurrent load.

## Bug Location

- `src/pool.ts`: Creates new connections or reserves connections without releasing them

## Expected Behavior

- Use a single SQL instance with configured connection pooling
- Reserved connections should be released using `release()` or `using` syntax
- Connection pool should be properly configured with appropriate limits
- Connections should be reused efficiently for concurrent operations

## Actual Behavior

- New SQL instances are created for each operation
- Reserved connections are not released back to the pool
- Under concurrent load, connections are exhausted
- Connection timeouts occur due to pool starvation

## How to Test

```bash
bun test
```

## Files

- `src/pool.ts` - Buggy implementation with connection leaks
- `test/pool.test.ts` - Tests that demonstrate connection exhaustion
- `solution/pool.ts` - Fixed implementation with proper pool management

## Bun.sql Connection Pool Reference

Bun.sql provides built-in connection pooling:

```ts
import { SQL } from "bun";

// Configure pool with limits
const sql = new SQL({
  hostname: "localhost",
  database: "mydb",
  max: 10,              // Maximum connections
  idleTimeout: 30,      // Close idle connections after 30s
  connectionTimeout: 10 // Connection timeout
});

// CORRECT: Using reserved connection with proper release
const reserved = await sql.reserve();
try {
  await reserved`SELECT * FROM users`;
} finally {
  reserved.release(); // Always release!
}

// BETTER: Using Symbol.dispose for automatic release
{
  using reserved = await sql.reserve();
  await reserved`SELECT * FROM users`;
} // Automatically released

// WRONG: Leaking connections
const reserved = await sql.reserve();
await reserved`SELECT * FROM users`;
// Forgot to release - connection leak!
```
