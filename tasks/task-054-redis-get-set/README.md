# Task 054: Redis GET/SET Null Handling Bug

## Problem Description

The Redis client doesn't handle null/undefined values correctly when getting and setting keys. This causes unexpected behavior when retrieving non-existent keys or setting empty values.

## Bug Details

The implementation has two issues:

1. When getting a key that doesn't exist, Redis returns `null`, but the code doesn't properly check for this and may try to operate on `null` as if it were a string.

2. When setting a value, the code doesn't validate the input, allowing `undefined` to be passed which gets coerced to the string `"undefined"` instead of being rejected or handled appropriately.

For example:
- `get("nonexistent")` returns `null` but code assumes it's always a string
- `set("key", undefined)` stores `"undefined"` as a string instead of handling the edge case

## Files

- `src/redis.ts` - Buggy implementation with improper null/undefined handling
- `test/redis.test.ts` - Tests that verify correct null handling (will fail)
- `solution/redis.ts` - Fixed implementation with proper null checks

## Expected Behavior

- `get()` should return `null` for missing keys and be explicitly handled
- `set()` should validate that the value is not `null` or `undefined` before storing
- The wrapper functions should provide type-safe interfaces

## How to Run

```bash
# Run the failing test
bun test

# Run the example
bun run src/redis.ts
```

## Prerequisites

Requires a running Redis server on `localhost:6379`.
