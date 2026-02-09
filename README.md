# Bun-Bench Tasks

A synthetic benchmark repository for evaluating AI code generation models on Bun.js tasks.

## Overview

This repository contains **80 controlled benchmark tasks** with:
- Intentionally buggy code
- Failing tests that pass when fixed
- Reference solutions

Each task tests understanding of specific Bun APIs and common programming patterns.

## Setup for Open Router

To use Open Router models with this project:

1. **Get an API Key**: Sign up at [openrouter.ai](https://openrouter.ai) and create an API key

2. **Configure Environment**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your Open Router API key
   OPENROUTER_API_KEY=your_key_here
   ```

3. **Optional - Claude API Compatibility Mode**:
   If you want to use Claude models via Open Router with Claude API compatibility:
   ```bash
   # In .env, set:
   ANTHROPIC_AUTH_TOKEN=your_openrouter_api_key
   ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
   ```

4. **Load Environment**: The Bun runtime will automatically load variables from `.env` file

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
| TCP/UDP | 051-053 | `Bun.listen()`, `Bun.connect()`, `Bun.udpSocket()` |
| Redis | 054-056 | `Bun.RedisClient`, pub/sub, expiration |
| PostgreSQL | 057-060 | `Bun.sql`, transactions, pools, types |
| Streams | 061-064 | `ReadableStream`, `WritableStream`, `TransformStream` |
| HTMLRewriter | 065-067 | `HTMLRewriter`, element/text handlers |
| Glob | 068-069 | `Bun.Glob`, pattern matching, scanning |
| Workers | 070-072 | `Worker`, messaging, error handling |
| Cookies | 073-074 | `Bun.CookieMap`, `Bun.Cookie` |
| Semver | 075-076 | `Bun.semver`, version comparison, ranges |
| Snapshots | 077-078 | `toMatchSnapshot()`, inline snapshots |
| Compile | 079-080 | `bun build --compile`, asset embedding |

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
| Easy | 001-010, 041-045, 073-076 | Single-line fixes, obvious bugs |
| Medium | 011-030, 051-056, 068-072 | Multiple changes, API understanding |
| Hard | 031-040, 046-050, 057-067, 077-080 | Complex patterns, security issues |

## License

MIT
