# Task 036: Password Hashing Bug

## Problem Description

The authentication module uses MD5 hashing for password storage instead of Bun's secure password hashing API with bcrypt or argon2.

## Bug Details

The implementation uses a simple MD5 hash via `Bun.CryptoHasher("md5")` to hash passwords. This is insecure because:

1. MD5 is a fast hash designed for checksums, not password storage
2. It's vulnerable to rainbow table attacks (no salt)
3. GPU cracking can test billions of MD5 hashes per second
4. MD5 has known collision vulnerabilities

The correct approach uses `Bun.password.hash()` which:
- Uses bcrypt or argon2 (slow, memory-hard algorithms)
- Automatically generates and embeds a unique salt
- Provides configurable cost factors to resist future hardware improvements

## Files

- `src/auth.ts` - Buggy implementation using MD5 hash
- `test/auth.test.ts` - Test that verifies secure password hashing (will fail)
- `solution/auth.ts` - Fixed implementation using `Bun.password.hash()`

## Expected Behavior

Password hashing should:
1. Use bcrypt or argon2 algorithm
2. Generate a unique salt per password
3. Produce output that can be verified with `Bun.password.verify()`
4. Take measurable time (not instant) to compute

## How to Run

```bash
# Run the failing test
bun test

# Test the auth module
bun run src/auth.ts
```
