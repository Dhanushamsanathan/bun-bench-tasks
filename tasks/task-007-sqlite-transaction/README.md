# Task 007: Transaction Rollback

## Problem Description

The database module performs multi-step operations without proper transaction handling. When an error occurs mid-operation, partial writes persist in the database instead of being rolled back, leaving the data in an inconsistent state.

## Bug Location

- `src/transfer.ts`: Transfer operations don't use transactions, causing partial state on failure

## Expected Behavior

- Multi-step database operations should be atomic
- If any step fails, all changes should be rolled back
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
- `solution/transfer.ts` - Fixed implementation with proper transaction handling
