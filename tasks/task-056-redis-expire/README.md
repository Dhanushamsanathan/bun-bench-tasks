# Task 056: Redis Key Expiration Bug

## Problem Description

The Redis key expiration is not set correctly due to wrong time unit usage and missing await statements. Keys either never expire, expire immediately, or have incorrect TTL values.

## Bug Details

The implementation has several issues:

1. Using milliseconds when Redis EXPIRE command expects seconds
2. Missing `await` on async Redis operations, causing race conditions
3. Using EXPIRE instead of PEXPIRE for millisecond precision
4. Not checking if SETEX/EXPIRE actually succeeded

For example:
- `setWithTTL("key", "value", 5000)` should set 5 second TTL but sets 5000 seconds (83 minutes!)
- Missing await means the expiration may not be set before the function returns
- Keys that should expire in seconds persist for hours

## Files

- `src/expire.ts` - Buggy implementation with incorrect expiration handling
- `test/expire.test.ts` - Tests that verify correct TTL behavior (will fail)
- `solution/expire.ts` - Fixed implementation with proper time unit handling

## Expected Behavior

- `setWithTTL()` should accept milliseconds and convert to seconds for EXPIRE
- `setWithTTLSeconds()` should use seconds directly with EXPIRE
- `setWithTTLMillis()` should use PEXPIRE for millisecond precision
- All operations should be properly awaited

## How to Run

```bash
# Run the failing test
bun test

# Run the example
bun run src/expire.ts
```

## Prerequisites

Requires a running Redis server on `localhost:6379`.
