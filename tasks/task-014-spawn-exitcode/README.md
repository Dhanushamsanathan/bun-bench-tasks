# Task 014: Spawn Exit Code

## Problem Description

The `runCommandSafe` function is supposed to execute a command and return whether it succeeded or failed. However, the current implementation has a bug where it never checks the exit code, treating all commands as successful regardless of their actual exit status.

## Expected Behavior

- Spawn a subprocess with the given command
- Wait for the process to complete
- Check the exit code
- Return success (true) only if exit code is 0
- Return failure (false) if exit code is non-zero

## Current Bug

The implementation calls `Bun.spawn()` but never:
1. Waits for the process to complete (`proc.exited`)
2. Checks the exit code (`proc.exitCode`)

This means failed commands are incorrectly reported as successful, which could lead to:
- Silent failures in build scripts
- Incorrect assumptions about command success
- Missing error handling

## Files

- `src/executor.ts` - Buggy implementation
- `test/executor.test.ts` - Tests that demonstrate the bug
- `solution/executor.ts` - Corrected implementation

## Bun APIs Used

- `Bun.spawn()` - Spawn a subprocess
- `proc.exited` - Promise that resolves when process exits
- `proc.exitCode` - The exit code (available after `exited` resolves)

## Learning Objective

Understand how to properly check exit codes from spawned processes:
1. `proc.exited` is a Promise - await it to wait for completion
2. `proc.exitCode` is only valid after the process has exited
3. Exit code 0 = success, non-zero = failure
