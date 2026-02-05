# Task 046: Shell Command Injection

## Problem Description

This task involves a utility that reads file contents using Bun's shell (`Bun.$`). The current implementation has a **command injection vulnerability** because user input is directly interpolated into the shell command without proper escaping.

## The Bug

In `src/runner.ts`, the filename is directly interpolated into the shell template:

```typescript
const result = await Bun.$`cat ${filename}`.text();
```

While Bun's tagged template literal syntax for shell commands does provide some automatic escaping, the current implementation doesn't properly handle all edge cases. The code should use explicit escaping or the safe array syntax for untrusted input.

## Expected Behavior

- Filenames with special characters should be handled safely
- No command injection should be possible
- The function should read the file contents correctly even with unusual filenames

## Actual Behavior

- Filenames with shell metacharacters may cause unexpected behavior
- Potential for command injection attacks
- Files with spaces, semicolons, or pipes in names may not work correctly

## Files

- `src/runner.ts` - Buggy implementation with injection vulnerability
- `test/runner.test.ts` - Tests that expose the vulnerability
- `solution/runner.ts` - Fixed implementation with proper escaping

## How to Test

```bash
cd task-046-shell-injection
bun test
```

## Hints

1. Bun.$ with tagged templates does escape values, but raw string concatenation doesn't
2. Consider using `Bun.$.escape()` for explicit escaping
3. Validate input before passing to shell commands
4. Consider using Bun.file() for reading files instead of shell cat
