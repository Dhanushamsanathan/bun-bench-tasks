# Task 039: HMAC Signing Bug

## Problem Description

The HMAC signature module has an encoding mismatch - it generates signatures in base64 but verification expects hex encoding, causing all signature verifications to fail.

## Bug Details

The implementation creates HMAC signatures with inconsistent encoding:

```typescript
// Sign function outputs base64
return hasher.digest("base64");

// Verify function expects hex
const expectedSignature = hasher.digest("hex");
```

This causes:

1. **Verification always fails**: Generated and expected signatures use different encodings
2. **API integration failures**: External services expecting consistent encoding will reject signatures
3. **Silent failures**: The signatures look valid but never match

The correct approach ensures consistent encoding (either hex or base64) for both signing and verification.

## Files

- `src/hmac.ts` - Buggy implementation with base64/hex encoding mismatch
- `test/hmac.test.ts` - Test that verifies HMAC signing (will fail)
- `solution/hmac.ts` - Fixed implementation with consistent hex encoding

## Expected Behavior

HMAC signing should:
1. Use consistent encoding (hex or base64) for sign and verify
2. Generate deterministic signatures for same input and key
3. Verify valid signatures successfully
4. Reject tampered data or wrong keys

## How to Run

```bash
# Run the failing test
bun test

# Test the HMAC module
bun run src/hmac.ts
```
