# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a **benchmark evaluation repository** containing 80 intentionally buggy Bun.js tasks for testing AI code generation. Each task has buggy source code, failing tests, and reference solutions.

## Commands

```bash
# Run tests for a specific task (from task directory)
cd tasks/task-001-content-length && bun test

# Run tests for a specific task (from root)
TASK=task-001-content-length bun run test:task

# Run all tasks (expect failures with buggy code)
bun run test:all

# Run solutions to verify they pass
bun run test:solutions

# List all tasks
bun run list
```

## Task Structure

Each task in `tasks/task-XXX-name/` contains:
- `README.md` - Problem description and bug details
- `src/*.ts` - Intentionally buggy implementation
- `test/*.test.ts` - Tests that fail until bug is fixed
- `solution/*.ts` - Reference fix that passes all tests

## Working with Tasks

When fixing a task:
1. Read the task's README.md to understand the bug
2. Run `bun test` to see failing tests
3. Fix the code in `src/`
4. Verify with `bun test`

To compare against solution: `cp solution/*.ts src/`

## Bun-Specific Guidelines

- Use `bun` instead of `npm`, `pnpm`, or `yarn`
- Use `bun test` instead of `jest` or `vitest`
- Tests use `bun:test` module (`describe`, `it`, `expect`, `beforeAll`, `afterAll`)
- Use Bun APIs (`Bun.serve`, `Bun.file`, `Bun.write`, `Bun.$`, etc.) over Node.js equivalents

## Common Bug Patterns in Tasks

- UTF-8 byte length vs character count
- SQL injection (string interpolation instead of parameterized queries)
- Weak crypto (MD5 instead of bcrypt)
- Shell command injection
- Wrong API parameter types (string vs array for `Bun.build()` entrypoints)
- Missing async/await
- Incorrect error handling
