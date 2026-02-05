# Task 048: Shell Pipe

## Problem Description

This task involves a text processing utility that uses shell pipes to transform data. The current implementation **incorrectly pipes commands**, causing intermediate output to be lost or garbled.

## The Bug

In `src/pipeline.ts`, commands are piped incorrectly. Instead of using Bun's proper pipe syntax, the code attempts to manually chain commands:

```typescript
// BUG: This doesn't properly pipe - runs commands separately
const result1 = await Bun.$`cat ${file}`.text();
const result2 = await Bun.$`grep ${pattern}`.text(); // stdin not connected!
```

Or tries to use string interpolation for piping:

```typescript
// BUG: This creates a single command string, losing proper escaping
const result = await Bun.$`${{ raw: `cat ${file} | grep ${pattern}` }}`.text();
```

## Expected Behavior

- Commands should be properly piped with output flowing to next command's stdin
- Intermediate output should be preserved through the pipeline
- Each stage should receive the previous stage's output

## Actual Behavior

- Second command receives empty stdin
- Pipeline stages run independently without data flow
- Output is lost between stages

## Files

- `src/pipeline.ts` - Buggy implementation with broken pipes
- `test/pipeline.test.ts` - Tests that expose the piping issues
- `solution/pipeline.ts` - Fixed implementation with proper piping

## How to Test

```bash
cd task-048-shell-pipe
bun test
```

## Hints

1. Use Bun's `.pipe()` method to chain commands
2. Or use the pipe operator directly in the template: `Bun.$`cmd1 | cmd2``
3. Alternatively, capture output and pass as stdin to next command
4. Consider using Bun's native APIs for simple transformations
