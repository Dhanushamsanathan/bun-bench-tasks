# Bun-Bench Tasks

A synthetic benchmark repository for evaluating AI code generation models on Bun.js tasks.

## Overview

This repository contains **50 controlled benchmark tasks** with:
- Intentionally buggy code
- Failing tests that pass when fixed
- Reference solutions

Each task tests understanding of specific Bun APIs and common programming patterns.

## Task Categories

| Category | Tasks | APIs Covered |
|----------|-------|--------------|
| HTTP Server | 001-005 | `Bun.serve()`, `Response`, `Request` |
| SQLite | 006-010 | `bun:sqlite`, `Database`, transactions |
| File I/O | 011-015 | `Bun.file()`, `Bun.write()`, `Bun.spawn()` |
| Testing | 016-020 | `bun:test`, mocks, async tests |
| WebSocket | 021-025 | `Bun.serve({ websocket })` |
| HTTP Client | 026-030 | `fetch()`, `AbortController` |
| Bundler | 031-035 | `Bun.build()` |
| Crypto | 036-040 | `Bun.password`, `Bun.CryptoHasher` |
| Environment | 041-045 | `Bun.env`, `.env` files |
| Shell/CLI | 046-050 | `Bun.$`, `Bun.argv` |

## Task Structure

Each task follows this structure:

```
tasks/task-XXX-name/
├── README.md           # Problem description
├── src/
│   └── *.ts            # Buggy implementation
├── test/
│   └── *.test.ts       # Failing tests
└── solution/
    └── *.ts            # Fixed implementation
```

## Usage

### Running Tests (Buggy Code)

```bash
# Run tests for a specific task (should fail)
cd tasks/task-001-content-length
bun test

# Expected output: tests fail
```

### Verifying Solutions

```bash
# Copy solution and run tests (should pass)
cp solution/server.ts src/server.ts
bun test

# Expected output: all tests pass
```

### Running All Tests

```bash
# From repository root
bun run test:all
```

## For Benchmark Evaluation

### Input Format

Models receive:
1. The `README.md` problem description
2. The buggy `src/*.ts` file(s)
3. The failing `test/*.test.ts` file(s)

### Expected Output

Models should produce a patch/diff that fixes the buggy code.

### Evaluation

```bash
# Apply model's patch
git apply model_patch.diff

# Run tests
bun test

# Score: pass rate of tests
```

## Difficulty Levels

| Level | Tasks | Description |
|-------|-------|-------------|
| Easy | 001-010, 041-045 | Single-line fixes, obvious bugs |
| Medium | 011-030 | Multiple changes, API understanding |
| Hard | 031-040, 046-050 | Complex patterns, security issues |

## License

MIT
