# Bun Benchmark - Full Evaluation Report
**All 80 Tasks**

**Generated:** 2026-02-10
**Model:** Qwen (via OpenRouter)
**Total Tasks:** 80
**Evaluated:** 79 (task-071 excluded due to infinite hang)

---

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tasks** | 80 | 100% |
| **Tasks Evaluated** | 79 | 98.75% |
| **✅ Passed** | 24 | 30.4% |
| **❌ Failed** | 42 | 53.2% |
| **⚠️ No Inference** | 12 | 15.2% |
| **🚫 Error** | 1 | 1.3% |
| **⏭️ Skipped** | 1 | 1.3% (task-071) |

**Overall Success Rate: 30.4%** (24/79 evaluated tasks)

---

## Detailed Results by Category

### Tasks 001-070 (70 tasks evaluated)

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | 21 | 30.0% |
| ❌ Failed | 37 | 52.9% |
| ⚠️ No Inference | 12 | 17.1% |

**Success Rate: 36.2%** (21/58 tasks with inference)

### Tasks 072-080 (9 tasks evaluated)

| Result | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | 3 | 37.5% |
| ❌ Failed | 5 | 62.5% |
| 🚫 Error | 1 | permission error |

**Success Rate: 37.5%** (3/8 tasks with valid evaluation)

---

## Passed Tasks ✅ (24 total)

### Tasks 001-070 (21 passed)
1. **task-001-content-length** - Content-Length header calculation
2. **task-002-json-content-type** - JSON content-type handling
3. **task-003-body-parsing** - Request body parsing
4. **task-004-route-params** - Route parameter extraction
5. **task-005-error-status** - HTTP error status codes
6. **task-013-spawn-stdout** - Spawn stdout capture
7. **task-022-ws-binary** - WebSocket binary messages
8. **task-023-ws-close** - WebSocket close handling
9. **task-024-ws-broadcast** - WebSocket broadcast
10. **task-025-ws-auth** - WebSocket authentication
11. **task-031-build-entry** - Bun build entry points
12. **task-034-build-minify** - Bun build minification
13. **task-035-build-target** - Bun build targets
14. **task-036-password-hash** - Password hashing (bcrypt)
15. **task-038-uuid** - UUID generation
16. **task-039-hmac** - HMAC signing
17. **task-040-hash-stream** - Stream hashing
18. **task-045-import-meta** - Import.meta usage
19. **task-051-tcp-server** - TCP server implementation
20. **task-063-transform-stream** - Transform streams
21. **task-070-worker-message** - Worker messaging

### Tasks 072-080 (3 passed)
22. **task-072-worker-terminate** - Worker termination
23. **task-073-cookie-parse** - Cookie parsing
24. **task-077-snapshot-object** - Object snapshots

---

## Failed Tasks ❌ (42 total)

### Common Failure Patterns

#### 1. **SQL/Database Issues (10 tasks)**
- task-006-sqlite-params - SQL parameterization (apostrophes, quotes)
- task-007-sqlite-transaction - Transaction rollback
- task-008-sqlite-blob - BLOB binary data corruption
- task-009-sqlite-bigint - BigInt precision loss
- task-010-sqlite-query-all - Multiple row queries
- task-057-sql-query - SQL query builder
- task-058-sql-transaction - SQL transaction handling
- task-059-sql-pool - Connection pool issues
- task-054-redis-get-set - Redis operations (timeout)
- task-055-redis-pubsub - Redis pub/sub (timeout)

#### 2. **File I/O Issues (3 tasks)**
- task-011-file-encoding - ArrayBuffer vs string confusion
- task-012-file-write - Missing await on file operations
- task-015-file-exists - Performance issues with large files

#### 3. **Timeout/Hang Issues (4 tasks)**
- task-019-test-timeout - Test timeout handling (45.8s)
- task-027-fetch-timeout - Fetch timeout implementation
- task-052-tcp-client - TCP connection timeout
- task-080-compile-target - Compile target validation

#### 4. **HTTP/Fetch Issues (4 tasks)**
- task-026-fetch-error - Error handling (no inference)
- task-028-fetch-headers - Header modification
- task-029-fetch-json - JSON response handling
- task-030-fetch-response - Response type validation

#### 5. **Environment/Config Issues (4 tasks)**
- task-041-env-vars - Environment variable validation
- task-043-env-types - Environment variable types
- task-044-env-validate - Config validation
- task-042-env-file - .env file parsing (no inference)

#### 6. **Shell/Process Issues (4 tasks)**
- task-014-spawn-exitcode - Exit code handling
- task-046-shell-injection - Shell command injection
- task-047-shell-error - Shell error handling
- task-048-shell-pipe - Shell piping
- task-049-shell-env - Shell environment variables
- task-050-cli-args - CLI argument parsing

#### 7. **HTML/Template Issues (3 tasks)**
- task-065-html-element - HTML element rewriting
- task-066-html-text - HTML text rewriting
- task-068-glob-match - Glob pattern matching

#### 8. **Version/Semver Issues (2 tasks)**
- task-075-semver-compare - Pre-release version comparison
- task-076-semver-range - Semver range matching

#### 9. **Cookie/Snapshot Issues (3 tasks)**
- task-074-cookie-set - Cookie security attributes
- task-078-snapshot-inline - Inline snapshot updates

#### 10. **Other Issues (7 tasks)**
- task-018-expect-type - Expect type assertions
- task-021-ws-message - WebSocket messages
- task-032-build-external - External build files (no inference)
- task-033-build-outdir - Build output directory
- task-037-hash-compare - Hash comparison timing
- task-053-udp-socket - UDP socket communication
- task-069-glob-scan - Glob directory scanning

---

## Tasks Without Inference ⚠️ (12 total)

The AI model did not generate fix code for these tasks:

1. **task-016-test-async** - Async test patterns
2. **task-017-mock-cleanup** - Mock cleanup
3. **task-020-describe-scope** - Describe scope
4. **task-026-fetch-error** - Fetch error handling
5. **task-032-build-external** - External build files
6. **task-042-env-file** - .env file parsing
7. **task-056-redis-expire** - Redis expiration
8. **task-060-sql-types** - SQL type handling
9. **task-061-readable-stream** - Readable streams
10. **task-062-writable-stream** - Writable streams
11. **task-064-stream-pipe** - Stream piping
12. **task-067-html-links** - HTML link extraction

---

## Skipped Tasks ⏭️ (1 total)

1. **task-071-worker-error** - Worker error handling
   - **Reason:** Infinite hang due to missing `reject()` in Promise
   - **Bug:** Worker onerror handler doesn't reject promise, causing eternal wait
   - **Impact:** Cannot be evaluated without manual intervention

---

## Tasks with Errors 🚫 (1 total)

1. **task-079-compile-assets** - Compile assets
   - **Error:** `EPERM: operation not permitted` copying `assets` directory
   - **Reason:** Permission issue during backup/restore process

---

## Performance Analysis

### Longest Running Tasks (Tasks 001-070)
1. **task-019-test-timeout**: 45.8 seconds (timeout issue)
2. **task-027-fetch-timeout**: 5.8 seconds (timeout issue)
3. **task-055-redis-pubsub**: 31.5 seconds (Redis connection timeout)
4. **task-054-redis-get-set**: 10.2 seconds (Redis connection timeout)
5. **task-052-tcp-client**: 5.9 seconds (TCP timeout)
6. **task-014-spawn-exitcode**: 1.1 seconds
7. **task-036-password-hash**: 1.1 seconds (bcrypt is slow)
8. **task-015-file-exists**: 953ms (file system check)
9. **task-023-ws-close**: 1.6 seconds (WebSocket)
10. **task-024-ws-broadcast**: 1.7 seconds (WebSocket)

### Longest Running Tasks (Tasks 072-080)
1. **task-080-compile-target**: 18.6 seconds (timeout + compilation)
2. **task-072-worker-terminate**: 1.7 seconds
3. **task-077-snapshot-object**: 261ms
4. **task-073-cookie-parse**: 111ms

---

## Category Breakdown

### HTTP/Web Server (7 tasks)
- **Passed:** 5/7 (71.4%)
- **Failed:** 2/7 (28.6%)
- Strong performance on basic HTTP handling

### WebSockets (5 tasks)
- **Passed:** 4/5 (80%)
- **Failed:** 1/5 (20%)
- Excellent WebSocket handling

### SQL/Database (10 tasks)
- **Passed:** 0/10 (0%)
- **Failed:** 10/10 (100%)
- **Major weakness** - all database tasks failed

### File I/O (3 tasks)
- **Passed:** 0/3 (0%)
- **Failed:** 3/3 (100%)
- Complete failure on file operations

### Build System (5 tasks)
- **Passed:** 3/5 (60%)
- **Failed:** 2/5 (40%)
- Decent build system understanding

### Cryptography (4 tasks)
- **Passed:** 3/4 (75%)
- **Failed:** 1/4 (25%)
- Strong crypto handling

### Environment/Config (4 tasks)
- **Passed:** 0/4 (0%)
- **Failed:** 3/4 (75%)
- **No Inference:** 1/4 (25%)
- Poor environment variable handling

### Shell/Process (6 tasks)
- **Passed:** 1/6 (16.7%)
- **Failed:** 5/6 (83.3%)
- Weak shell command handling

### Streams (4 tasks)
- **Passed:** 1/4 (25%)
- **Failed:** 1/4 (25%)
- **No Inference:** 2/4 (50%)
- Limited stream capabilities

### Workers (3 tasks)
- **Passed:** 2/3 (66.7%)
- **Failed:** 0/3 (0%)
- **Skipped:** 1/3 (33.3%)
- Good worker understanding

### HTML/Template (3 tasks)
- **Passed:** 0/3 (0%)
- **Failed:** 2/3 (66.7%)
- **No Inference:** 1/3 (33.3%)
- Poor HTML manipulation

---

## Key Insights

### Strengths
1. ✅ **HTTP/WebSockets:** Strong understanding of web protocols (71-80% success)
2. ✅ **Cryptography:** Good implementation of hashing and signing (75% success)
3. ✅ **Build System:** Decent Bun.build API knowledge (60% success)
4. ✅ **Workers:** Good grasp of web worker patterns (67% success, excluding hang)

### Weaknesses
1. ❌ **SQL/Database:** Complete failure on all database tasks (0% success)
2. ❌ **File I/O:** Total failure on file operations (0% success)
3. ❌ **Environment Variables:** Poor config handling (0% success)
4. ❌ **Shell Commands:** Weak process/shell interaction (17% success)
5. ❌ **Timeout Handling:** Multiple timeout-related failures

### Model Limitations
1. ⚠️ **No Inference:** 12 tasks (15%) had no code generated
2. ⚠️ **Precision Issues:** BigInt and binary data corruption
3. ⚠️ **Timeout Issues:** Several tests hit 5-second timeout limits
4. ⚠️ **Async Patterns:** Some tasks show misunderstanding of async/await

---

## Recommendations

### For Model Training
1. **Improve SQL/dataset handling** - 100% failure rate needs attention
2. **Better async/timeout understanding** - Multiple hang issues
3. **File I/O best practices** - Current failures on basic file ops
4. **Environment variable patterns** - Critical for real-world apps

### For Benchmark Suite
1. **Fix task-071** - Add timeout wrapper to prevent infinite hangs
2. **Fix task-079** - Resolve permission issues with asset directories
3. **Add timeouts** - All tests should have 10-30 second max timeouts
4. **Better error messages** - Some tests have unclear failure modes

### For Users
1. **Use the model with caution** - 30% success rate means manual review required
2. **Focus on strengths** - Model performs well on HTTP, crypto, workers
3. **Avoid weak areas** - Don't rely on model for SQL, file I/O, or shell commands
4. **Always test** - Even "passed" tasks should be verified

---

## Conclusion

The AI model achieved a **30.4% success rate** on the Bun benchmark, showing strong capabilities in web protocols, cryptography, and build systems, but significant weaknesses in database operations, file I/O, and shell command handling.

The benchmark revealed critical issues with:
- Async/timeout patterns (5+ tasks hanging or timing out)
- Type precision (BigInt, binary data corruption)
- Missing inference capabilities (12 tasks with no code generated)

**Overall Assessment:** The model demonstrates promising ability for straightforward Bun.js tasks but struggles with complex operations involving databases, file systems, and precise type handling.

---

**Report End**