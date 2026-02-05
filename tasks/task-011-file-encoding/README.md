# Task 011: File Read Encoding

## Problem Description

The `readConfig` function is supposed to read a configuration file and return its contents as a string. However, the current implementation has a bug that causes it to return incorrect data.

## Expected Behavior

- Read a text file from disk
- Return the file contents as a proper string
- Handle UTF-8 encoded files correctly

## Current Bug

The implementation uses `Bun.file().arrayBuffer()` instead of `Bun.file().text()`, which returns an `ArrayBuffer` instead of a string. The code then incorrectly type-casts this to a string, resulting in `[object ArrayBuffer]` or similar garbage output instead of the actual file contents.

## Files

- `src/reader.ts` - Buggy implementation
- `test/reader.test.ts` - Tests that demonstrate the bug
- `solution/reader.ts` - Corrected implementation

## Bun APIs Used

- `Bun.file()` - Create a file reference
- `file.text()` - Read file as UTF-8 string (correct)
- `file.arrayBuffer()` - Read file as ArrayBuffer (incorrect for text)

## Learning Objective

Understand the difference between Bun's file reading methods and when to use each one:
- `.text()` for string content
- `.arrayBuffer()` for binary data
- `.json()` for JSON parsing
- `.bytes()` for Uint8Array
