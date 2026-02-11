# Bun Benchmark - z-ai/glm-4.7-flash
Generated: 2/10/2026, 5:15:51 PM

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 80 |
| Evaluated | 15 |
| Skipped | 65 |
| **Passed** | **7 ✅** |
| **Failed** | **8 ❌** |
| **Pass Rate** | **46.7%** |
| Avg Inference Time | 53390ms |
| Avg Test Time | 342ms |
| Total Inference Time | 26.7min |

## Results by Category

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| HTTP Server | 5 | 4 | 1 | 80.0% |
| File I/O | 5 | 2 | 3 | 40.0% |
| SQLite | 5 | 1 | 4 | 20.0% |
| Testing | 5 | 0 | 0 | 0.0% |
| WebSocket | 5 | 0 | 0 | 0.0% |
| HTTP Client | 5 | 0 | 0 | 0.0% |
| Bundler | 5 | 0 | 0 | 0.0% |
| Crypto | 5 | 0 | 0 | 0.0% |
| Environment | 5 | 0 | 0 | 0.0% |
| Shell/CLI | 5 | 0 | 0 | 0.0% |
| TCP/UDP | 3 | 0 | 0 | 0.0% |
| Redis | 3 | 0 | 0 | 0.0% |
| PostgreSQL | 4 | 0 | 0 | 0.0% |
| Streams | 4 | 0 | 0 | 0.0% |
| HTMLRewriter | 3 | 0 | 0 | 0.0% |
| Glob | 2 | 0 | 0 | 0.0% |
| Workers | 3 | 0 | 0 | 0.0% |
| Cookies | 2 | 0 | 0 | 0.0% |
| Semver | 2 | 0 | 0 | 0.0% |
| Snapshots | 2 | 0 | 0 | 0.0% |
| Compile | 2 | 0 | 0 | 0.0% |

## Results by Difficulty

| Difficulty | Total | Passed | Failed | Pass Rate |
|------------|-------|--------|--------|-----------|
| Unknown | 80 | 7 | 8 | 8.8% |

## Failed Tasks

### task-003-body-parsing
```
test\server.test.ts:

# Unhandled error between tests
-------------------------------
10 |       con
```

### task-006-sqlite-params
```
test\db.test.ts:
13 |       addUser("O'Brien", "obrien@test.com");
14 |     }).not.toThrow();
15 | 

```

### task-007-sqlite-transaction
```
test\transfer.test.ts:
(pass) Transaction Rollback > transfer should be atomic - rollback on constra
```

### task-009-sqlite-bigint
```
test\analytics.test.ts:
23 |     const timestamp = 1000000000000n; // ~2001 in milliseconds (as bigi
```

### task-010-sqlite-query-all
```
test\reports.test.ts:
31 |     createOrder(customerId, "Gizmo", 3, 15.0);
32 | 
33 |     const order
```

### task-013-spawn-stdout
```
test\runner.test.ts:
 9 |  *
10 |  * @param cmd - Array of command and arguments (e.g., ["echo", "he
```

### task-014-spawn-exitcode
```
test\executor.test.ts:
 9 |  *
10 |  * @param cmd - Array of command and arguments
11 |  * @returns 
```

### task-015-file-exists
```
test\checker.test.ts:
(pass) fileExists > should return true for existing file
(pass) fileExists > s
```
