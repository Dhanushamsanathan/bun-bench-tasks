# Task 013: Spawn Stdout

## Problem Description

The `runCommand` function is supposed to execute a command and return its stdout output. However, the current implementation has a bug where the stdout is never read, resulting in empty or lost output.

## Expected Behavior

- Spawn a subprocess with the given command
- Capture the stdout output
- Return the output as a string

## Current Bug

The implementation calls `Bun.spawn()` but never reads from the stdout stream. It immediately returns an empty string, completely ignoring the process output.

In Bun, when you spawn a process, stdout is available as a `ReadableStream` that must be consumed. Simply spawning the process doesn't automatically capture the output.

## Files

- `src/runner.ts` - Buggy implementation
- `test/runner.test.ts` - Tests that demonstrate the bug
- `solution/runner.ts` - Corrected implementation

## Bun APIs Used

- `Bun.spawn()` - Spawn a subprocess
- `proc.stdout` - ReadableStream of stdout
- `new Response(stream).text()` - Convert stream to string
- `Bun.readableStreamToText()` - Helper to read stream as text

## Learning Objective

Understand how to properly capture stdout from spawned processes in Bun:
1. `proc.stdout` is a `ReadableStream` (not a string!)
2. You must read the stream to get the output
3. Use `Bun.readableStreamToText()` or `new Response(stream).text()`
