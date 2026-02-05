# Task 047: Shell Error Handling

## Problem Description

This task involves a shell command executor that runs various system commands. The current implementation **fails to handle command errors properly** because it doesn't use `.nothrow()` when commands might fail, causing unexpected exceptions.

## The Bug

In `src/executor.ts`, shell commands that may fail (like checking if a file exists) throw exceptions instead of returning error information:

```typescript
// BUG: This throws if file doesn't exist instead of returning gracefully
const result = await Bun.$`test -f ${filename}`.text();
```

Without `.nothrow()`, Bun.$ throws an error when the command exits with a non-zero code.

## Expected Behavior

- Commands that fail should return error information, not throw
- Exit codes should be accessible for decision making
- stderr should be captured and available
- The application should handle both success and failure gracefully

## Actual Behavior

- Non-zero exit codes cause unhandled exceptions
- No way to check exit codes or stderr
- Application crashes on expected failures (like "file not found")

## Files

- `src/executor.ts` - Buggy implementation without proper error handling
- `test/executor.test.ts` - Tests that expose the error handling issues
- `solution/executor.ts` - Fixed implementation with `.nothrow()`

## How to Test

```bash
cd task-047-shell-error
bun test
```

## Hints

1. Use `.nothrow()` to prevent throwing on non-zero exit codes
2. Check `result.exitCode` to determine success/failure
3. Access `result.stderr` for error messages
4. Consider wrapping in try/catch for additional safety
