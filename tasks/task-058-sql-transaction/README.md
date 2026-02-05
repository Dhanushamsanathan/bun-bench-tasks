# Task 058: SQL Transaction Handling

## Problem Description

The database module performs multi-step operations without proper transaction handling using Bun.sql. When an error occurs mid-operation, partial writes persist in the database instead of being rolled back, leaving the data in an inconsistent state.

## Bug Location

- `src/transfer.ts`: Transfer operations don't use `sql.begin()` for transactions, causing partial state on failure

## Expected Behavior

- Multi-step database operations should be atomic using `sql.begin()`
- If any step fails, all changes should be rolled back automatically
- Database should remain in a consistent state after errors

## Actual Behavior

- Operations execute sequentially without transaction wrapping
- When an error occurs, previous steps remain committed
- Database ends up in an inconsistent state (e.g., money debited but not credited)

## How to Test

```bash
bun test
```

## Files

- `src/transfer.ts` - Buggy implementation without proper transactions
- `test/transfer.test.ts` - Tests that demonstrate data inconsistency
- `solution/transfer.ts` - Fixed implementation with proper `sql.begin()` transaction handling

## Bun.sql Transaction Reference

Bun.sql provides `sql.begin()` for transaction handling:

```ts
import { sql } from "bun";

// CORRECT: Using sql.begin() for atomic operations
await sql.begin(async (tx) => {
  await tx`UPDATE accounts SET balance = balance - 100 WHERE id = ${fromId}`;
  await tx`UPDATE accounts SET balance = balance + 100 WHERE id = ${toId}`;
  // Automatically commits on success, rolls back on error
});

// WRONG: No transaction wrapping
await sql`UPDATE accounts SET balance = balance - 100 WHERE id = ${fromId}`;
await sql`UPDATE accounts SET balance = balance + 100 WHERE id = ${toId}`;
// If second query fails, first one is already committed
```
