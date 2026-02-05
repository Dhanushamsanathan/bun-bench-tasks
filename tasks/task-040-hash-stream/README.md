# Task 040: Hash Streaming Bug

## Problem Description

The file hashing module loads entire files into memory before hashing instead of using streaming with `Bun.CryptoHasher`. This causes out-of-memory errors for large files and poor performance.

## Bug Details

The implementation reads the entire file into memory at once:

```typescript
const content = await Bun.file(filePath).text();
hasher.update(content);
```

This approach has problems:

1. **Memory exhaustion**: Large files (GB+) will crash the process
2. **Performance overhead**: Must wait for entire file to load before hashing begins
3. **Inefficient**: Could stream data in chunks for constant memory usage

The correct approach uses streaming with `Bun.CryptoHasher`:
- Read file in chunks
- Update hasher incrementally
- Constant memory usage regardless of file size

## Files

- `src/hashfile.ts` - Buggy implementation loading entire file into memory
- `test/hashfile.test.ts` - Test that verifies streaming hash (will fail)
- `solution/hashfile.ts` - Fixed implementation using streaming

## Expected Behavior

File hashing should:
1. Use constant memory regardless of file size
2. Stream file contents in chunks
3. Work efficiently with files of any size
4. Produce correct hash values

## How to Run

```bash
# Run the failing test
bun test

# Test the hash file module
bun run src/hashfile.ts
```
