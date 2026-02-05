# Task 009: BigInt Columns

## Problem Description

The analytics module stores large integer values (timestamps in nanoseconds, large counters, IDs) but doesn't enable BigInt mode in the SQLite database. JavaScript's Number type loses precision for integers larger than `Number.MAX_SAFE_INTEGER` (2^53 - 1), causing data corruption.

## Bug Location

- `src/analytics.ts`: Database not configured with `{ strict: true }` or BigInt handling

## Expected Behavior

- Large integers should be stored and retrieved with full precision
- Values larger than `Number.MAX_SAFE_INTEGER` should use BigInt
- No data loss or precision errors for 64-bit integers

## Actual Behavior

- Large integers lose precision when retrieved
- Nanosecond timestamps become incorrect
- Large IDs don't match after round-trip
- Counter values drift due to precision loss

## How to Test

```bash
bun test
```

## Files

- `src/analytics.ts` - Buggy implementation without BigInt support
- `test/analytics.test.ts` - Tests that demonstrate precision loss
- `solution/analytics.ts` - Fixed implementation with BigInt mode enabled
