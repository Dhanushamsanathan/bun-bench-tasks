# Two-Phase Benchmark Structure

## Directory Layout

```
bun-bench-tasks/
├── tasks/                    # Original 80 tasks (001-080)
│   ├── task-001-content-length/
│   ├── task-002-json-content-type/
│   ├── ...
│   └── task-080-compile-target/
│
├── tasks-advanced/           # New 100 tasks (081-180) 👈 NEW!
│   ├── task-081-content-length-utf8/
│   ├── task-082-sqlite-memory-leak/
│   ├── ...
│   └── task-180-mysql-timestamp/
│
├── scripts/
│   ├── generate-tasks.ts     # Generates tasks-advanced (081-180)
│   ├── run-inference.ts      # Works on both task sets
│   ├── run-evaluation.ts     # Works on both task sets
│   └── benchmark.ts          # Orchestration script
│
├── logs/                     # Shared log files
│   ├── step1-inference-*.txt
│   ├── step2-evaluation-*.txt
│   └── step3-report-*.txt
│
├── benchmark-report.json     # Combined report
├── EVALUATION-REPORT.md      # Phase 1 results
└── bun-bug-fix.txt          # Source of truth for phase 2
```

---

## Phase 1: Original Tasks (tasks/)

**Status:** ✅ Complete
**Range:** task-001 to task-080
**Focus:** Basic Bun.js APIs and common bugs

**Categories:**
- HTTP Server (Bun.serve)
- SQLite (bun:sqlite)
- File System (Bun.file)
- WebSocket
- Fetch API
- Bun.build()
- Password Hashing
- Environment Variables
- Shell Commands
- Streams

**Progress:**
- 34/80 tasks have inference
- 29/34 evaluated (14 passed, 15 failed)
- 46/80 remaining (need API credits)

---

## Phase 2: Advanced Tasks (tasks-advanced/)

**Status:** 🚧 Ready to generate
**Range:** task-081 to task-180
**Focus:** Advanced features, database drivers, system programming

**Categories:**

### Database (40% - 40 tasks)
- **PostgreSQL** (20 tasks): 121-140
  - Connection pooling, replication, binary protocol
  - Advanced features: LISTEN/NOTIFY, COPY, advisory locks
  - Transaction management, WAL mode
  - SSL/TLS, SCRAM authentication

- **MySQL** (20 tasks): 161-180
  - Binary protocol, prepared statements
  - X DevAPI document store
  - Replication (binlog), connection management
  - SSL, charset handling, geometry types

### System Programming (25% - 25 tasks)
- Process management, signal handling (134, 154)
- FFI, native bindings (142, 162)
- UDP sockets (121)
- DNS resolution (109)
- File system edge cases (119, 149, 189)

### Networking & Protocols (20% - 20 tasks)
- HTTP/2 server push (133)
- WebSocket advanced (104, 123, 143)
- Fetch edge cases (111, 144, 157)
- TLS certificate chains (114)
- Connection pooling (144)

### Build & Tooling (15% - 15 tasks)
- Bun.build advanced (125)
- Transpiler streaming (127)
- Coverage with top-level await (120)
- Hot module reloading (110)
- Patch management (124)

---

## Running Benchmarks

### Option A: Phase 1 Only (Original)

```bash
# Benchmark original 80 tasks
bun run scripts/benchmark.ts
```

**Runs on:** `tasks/` directory

### Option B: Phase 2 Only (Advanced)

```bash
# Benchmark advanced 100 tasks
TASKS_DIR=tasks-advanced bun run scripts/benchmark.ts
```

**Runs on:** `tasks-advanced/` directory

### Option C: Combined (Both Phases)

```bash
# Benchmark all 180 tasks
bun run scripts/benchmark-all.ts
```

**Runs on:** Both directories sequentially

---

## Generating Phase 2 Tasks

### Step 1: Generate Directories

```bash
bun run scripts/generate-tasks.ts
```

**Creates:**
- `tasks-advanced/task-081-*/` through `tasks-advanced/task-180-*/`
- README.md for each task
- Template files (src/, test/, solution/)

### Step 2: Implement Content

For each task in `tasks-advanced/`:

1. **Write buggy code** in `src/index.ts`
2. **Write tests** in `test/index.test.ts`
3. **Write solution** in `solution/index.ts`
4. **Verify:** `cd tasks-advanced/task-XXX && bun test`

### Step 3: Run Benchmark

```bash
# Run on advanced tasks only
cd tasks-advanced
bun run ../scripts/benchmark.ts
```

---

## Task Difficulty Comparison

| Aspect | Phase 1 (tasks/) | Phase 2 (tasks-advanced/) |
|--------|------------------|---------------------------|
| **APIs** | Basic Bun APIs | Database drivers, FFI, system calls |
| **Complexity** | Single file fixes | Multi-file, integration issues |
| **Setup** | Minimal (in-memory DB) | Requires external services |
| **Time per task** | 30 min - 1 hour | 2-4 hours |
| **Test setup** | Simple | Complex (databases, servers) |
| **Lines of code** | 50-100 LOC | 150-300 LOC |

---

## Estimated Effort

### Phase 2 Task Creation

| Category | Tasks | Hours/Task | Total Hours |
|----------|-------|------------|-------------|
| 🟢 Simple | 20 | 1-2 | 20-40 |
| 🟡 Medium | 50 | 2-3 | 100-150 |
| 🔴 Complex | 30 | 3-5 | 90-150 |
| **Total** | **100** | - | **210-340 hours** |

### Benchmark Runtime

| Phase | Tasks | Inference Time | Evaluation Time |
|-------|-------|----------------|-----------------|
| Phase 1 | 80 | ~20-30 min | ~5-10 min |
| Phase 2 | 100 | ~30-45 min | ~10-20 min |
| **Combined** | **180** | **~50-75 min** | **~15-30 min** |

---

## API Costs (Phase 2)

**Model:** qwen/qwen3-next-80b-a3b-thinking
**Max tokens:** 8000

| Metric | Phase 1 | Phase 2 | Total |
|--------|---------|---------|-------|
| Tasks | 80 | 100 | 180 |
| Avg. API cost/task | $0.10 | $0.15* | - |
| **Estimated Total** | $8 | $15 | **$23** |

*\*Phase 2 tasks are more complex, requiring longer prompts and responses*

---

## Reporting

### Separate Reports

```bash
# Phase 1 report
bun run scripts/benchmark.ts  # → benchmark-report.json

# Phase 2 report
cd tasks-advanced
bun run ../scripts/benchmark.ts  # → benchmark-report-advanced.json
```

### Combined Report

```bash
# Generate combined report for all 180 tasks
bun run scripts/generate-combined-report.ts
```

**Output:** `benchmark-combined.json` with:
- Phase 1 results (tasks 001-080)
- Phase 2 results (tasks 081-180)
- Comparative analysis
- Difficulty distribution
- Category-based statistics

---

## Scripts Reference

### For Phase 1 (tasks/)

```bash
# Current scripts work as-is
bun run scripts/benchmark.ts
bun run scripts/run-inference.ts
bun run scripts/run-evaluation.ts
```

### For Phase 2 (tasks-advanced/)

```bash
# Generate task directories
bun run scripts/generate-tasks.ts

# Run inference on advanced tasks
cd tasks-advanced
bun run ../scripts/run-inference.ts all

# Run evaluation on advanced tasks
bun run ../scripts/run-evaluation.ts all

# Full benchmark for advanced tasks
bun run ../scripts/benchmark.ts
```

### For Both Phases

```bash
# Run everything
bun run scripts/benchmark-all.ts  # TODO: create this
```

---

## Migration: Splitting Existing Tasks

If you want to reorganize existing tasks:

```bash
# Keep simple tasks in tasks/
tasks/task-001-content-length/    # Keep
tasks/task-002-json-content-type/ # Keep

# Move advanced tasks to tasks-advanced/
tasks/task-057-sql-query/         # → tasks-advanced/task-057-sql-query/
tasks/task-058-sql-transaction/   # → tasks-advanced/task-058-sql-transaction/
```

**Note:** Current 001-080 tasks are already well-distributed in difficulty.

---

## Summary

✅ **Phase 1 (tasks/)**: 80 tasks, basic to intermediate, mostly complete
✅ **Phase 2 (tasks-advanced/)**: 100 tasks, advanced to expert, ready to generate
✅ **Separation**: Clean separation allows independent benchmarking
✅ **Scalability**: Easy to add more phases in future

---

*Created: 2025-02-10*
*Phase 1: 80 tasks (001-080)*
*Phase 2: 100 tasks (081-180)*
*Total: 180 tasks*
