# Task 012: File Write Async

## Problem Description

The `saveData` and related functions are supposed to write data to files asynchronously. However, the current implementation has multiple bugs related to not properly awaiting `Bun.write()`.

## Expected Behavior

- Write data to a file asynchronously
- Wait for the write operation to complete before continuing
- Return accurate byte counts (not string lengths!)
- Handle unicode content correctly

## Current Bugs

1. **Missing await**: `Bun.write()` is called without `await`, so writes may not complete before subsequent operations
2. **Wrong byte count**: `saveDataWithCount` returns `data.length` (string length) instead of actual bytes written
   - For ASCII: string length == byte count (works by accident)
   - For unicode: string length != byte count (5 Japanese chars = 15 bytes, 1 emoji = 4 bytes)
3. **Race conditions**: Reading immediately after an un-awaited write may see stale/missing data

## Files

- `src/writer.ts` - Buggy implementation
- `test/writer.test.ts` - Tests that demonstrate the bug
- `solution/writer.ts` - Corrected implementation

## Bun APIs Used

- `Bun.write()` - Write data to a file (returns Promise!)
- `Bun.file()` - Create a file reference
- `file.text()` - Read file contents

## Learning Objective

Understand that `Bun.write()` returns a Promise that must be awaited. Forgetting to await async operations is a common bug that leads to race conditions and unpredictable behavior.
