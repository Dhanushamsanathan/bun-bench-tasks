# Task 008: BLOB Handling

## Problem Description

The file storage module incorrectly handles binary data (BLOBs) by converting them to strings, which corrupts binary data. This is a common mistake when storing files, images, or other binary content in SQLite.

## Bug Location

- `src/storage.ts`: Binary data is converted to string before storage and retrieval

## Expected Behavior

- Binary data should be stored as-is using Uint8Array or Buffer
- Retrieved data should match the original binary content byte-for-byte
- File hashes should be consistent before and after storage

## Actual Behavior

- Binary data is converted to string (toString() or implicit conversion)
- Non-UTF8 bytes are corrupted or lost
- Retrieved data has different size and content than original
- File checksums don't match

## How to Test

```bash
bun test
```

## Files

- `src/storage.ts` - Buggy implementation that corrupts binary data
- `test/storage.test.ts` - Tests that demonstrate data corruption
- `solution/storage.ts` - Fixed implementation using proper BLOB handling
