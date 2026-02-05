# Task 015: File Exists Check

## Problem Description

The `fileExists` function is supposed to check if a file exists before performing operations on it. However, the current implementation has a bug where it uses try/catch on file read operations instead of the proper `Bun.file().exists()` method.

## Expected Behavior

- Check if a file exists at the given path
- Return true if the file exists
- Return false if the file doesn't exist
- Not throw errors for non-existent files
- Be efficient (not read the entire file just to check existence)

## Current Bug

The implementation tries to read the file with `.text()` and catches any error, treating all errors as "file doesn't exist". This approach has several problems:

1. **Performance**: Reading the entire file just to check if it exists is wasteful
2. **False negatives**: Permission errors, I/O errors, etc. are incorrectly treated as "doesn't exist"
3. **Inefficient for large files**: A multi-GB file would be fully read just to check existence
4. **Race conditions**: The file state might change between check and actual use

## Files

- `src/checker.ts` - Buggy implementation
- `test/checker.test.ts` - Tests that demonstrate the bug
- `solution/checker.ts` - Corrected implementation

## Bun APIs Used

- `Bun.file()` - Create a file reference
- `file.exists()` - Check if file exists (correct!)
- `file.text()` - Read file content (wrong for existence check!)
- `file.size` - Get file size without reading content

## Learning Objective

Understand the proper way to check file existence in Bun:
1. Use `Bun.file(path).exists()` for existence checks
2. Don't read files just to check if they exist
3. Handle different error types appropriately
4. Consider using `file.size` when you need both existence and size
