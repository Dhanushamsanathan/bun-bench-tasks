# Task 038: Random UUID Bug

## Problem Description

The UUID generation module uses `Math.random()` to generate UUIDs instead of the cryptographically secure `crypto.randomUUID()` function.

## Bug Details

The implementation constructs UUIDs using `Math.random()`:

```typescript
const hex = () => Math.floor(Math.random() * 16).toString(16);
```

This is problematic because:

1. **Not cryptographically secure**: `Math.random()` uses a PRNG (Pseudo-Random Number Generator) that is predictable
2. **Invalid UUID format**: The implementation doesn't properly set the version and variant bits required by RFC 4122
3. **Collisions possible**: The weak randomness increases collision probability
4. **Security risk**: Predictable UUIDs can be exploited in session tokens, API keys, etc.

The correct approach uses `crypto.randomUUID()` which:
- Uses cryptographically secure random number generation
- Produces valid UUID v4 format (version 4, variant 1)
- Is built into the Web Crypto API and Bun runtime

## Files

- `src/uuid.ts` - Buggy implementation using Math.random()
- `test/uuid.test.ts` - Test that verifies secure UUID generation (will fail)
- `solution/uuid.ts` - Fixed implementation using `crypto.randomUUID()`

## Expected Behavior

UUID generation should:
1. Use `crypto.randomUUID()` for cryptographic security
2. Produce valid UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
3. Have version nibble = 4 and variant bits = 10xx
4. Be unique across all calls

## How to Run

```bash
# Run the failing test
bun test

# Test the UUID module
bun run src/uuid.ts
```
