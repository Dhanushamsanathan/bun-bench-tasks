# Task 037: Hash Comparison Bug

## Problem Description

The password verification module uses direct string comparison (`===`) instead of Bun's secure `Bun.password.verify()` function, making it vulnerable to timing attacks and incompatible with properly hashed passwords.

## Bug Details

The implementation compares password hashes using the `===` operator:

```typescript
return storedHash === await hashPassword(inputPassword);
```

This approach has several problems:

1. **Timing attacks**: String comparison may exit early on first mismatch, leaking timing information
2. **Incompatible with bcrypt/argon2**: Salted hashes produce different outputs each time, so direct comparison always fails
3. **Rehashing overhead**: Unnecessarily rehashes the input password instead of using the stored hash directly

The correct approach uses `Bun.password.verify()` which:
- Performs constant-time comparison
- Extracts the salt from the stored hash and uses it for verification
- Is specifically designed for password verification

## Files

- `src/verify.ts` - Buggy implementation using === comparison
- `test/verify.test.ts` - Test that verifies secure comparison (will fail)
- `solution/verify.ts` - Fixed implementation using `Bun.password.verify()`

## Expected Behavior

Password verification should:
1. Use `Bun.password.verify()` for comparison
2. Work correctly with bcrypt/argon2 hashed passwords
3. Return true for correct password, false for incorrect
4. Be resistant to timing attacks

## How to Run

```bash
# Run the failing test
bun test

# Test the verification module
bun run src/verify.ts
```
