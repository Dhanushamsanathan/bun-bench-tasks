# Bun Benchmark - Evaluation Report

**Model:** qwen/qwen3-next-80b-a3b-thinking
**Date:** 2025-02-10
**Total Tasks Evaluated:** 29

## Summary

| Metric | Count |
|--------|-------|
| ✅ **Passed** | 14 |
| ❌ **Failed** | 15 |
| 📊 **Success Rate** | 48.3% |

---

## ✅ Passed Tasks (14)

1. **task-001-content-length** - Content-Length UTF-8 bug fix
2. **task-002-json-content-type** - JSON Content-Type header
3. **task-003-body-parsing** - Request body parsing with await
4. **task-004-route-params** - Route parameter extraction
5. **task-005-error-status** - Error status codes
6. **task-008-sqlite-blob** - BLOB data handling
7. **task-011-file-encoding** - File encoding with .text()
8. **task-022-ws-binary** - WebSocket binary data
9. **task-023-ws-close** - WebSocket cleanup on disconnect
10. **task-024-ws-broadcast** - WebSocket broadcasting
11. **task-025-ws-auth** - WebSocket authentication
12. **task-028-fetch-headers** - Fetch with custom headers
13. **task-030-fetch-response** - Fetch response handling
14. **task-032-build-external** - Bun.build external dependencies

---

## ❌ Failed Tasks (15)

### Task-Specific Issues

#### **task-006-sqlite-params** (3 failures)
- **Issue:** SQL queries not handling special characters (apostrophes, quotes, backslashes)
- **Root Cause:** Model's code uses parameterized queries but still fails on special characters

#### **task-007-sqlite-transaction** (5 failures)
- **Issue:** Transaction rollback not working properly
- **Root Cause:** Model's code not using `db.transaction()` correctly - validation happens inside transaction instead of before

#### **task-010-sqlite-query-all** (10 failures)
- **Issue:** Using `.get()` instead of `.all()` for multi-row queries
- **Root Cause:** Model extracted wrong filename (types.ts instead of reports.ts)

#### **task-012-file-write** (9 failures)
- **Issue:** File writes not awaited, wrong byte counts
- **Root Cause:** Model extracted wrong filename (code1.ts instead of writer.ts)

#### **task-013-spawn-stdout** (15 failures)
- **Issue:** Windows compatibility - Unix commands (echo, ls, pwd) don't exist
- **Root Cause:** Tests use Unix commands that aren't available on Windows

#### **task-015-file-exists** (2 failures)
- **Issue:** File size calculation wrong for unicode (string.length instead of byte size)
- **Root Cause:** Model extracted wrong filename (code1.ts instead of checker.ts)

#### **task-018-expect-type** (3 failures)
- **Issue:** Using `toBe()` instead of `toEqual()` for object/array comparison
- **Root Cause:** Model's code had wrong assertions (using reference equality)

#### **task-019-test-timeout** (6 timeouts)
- **Issue:** Test timeouts - code too slow
- **Root Cause:** Model extracted wrong filename - test file instead of source

#### **task-021-ws-message** (2 failures)
- **Issue:** WebSocket message processing not working (uppercase, reverse actions)
- **Root Cause:** Incomplete fix - only fixed one action, not others

#### **task-026-fetch-error** (1 failure)
- **Issue:** Module not found (client.ts)
- **Root Cause:** Model extracted wrong filename (types.ts)

#### **task-027-fetch-timeout** (1 failure)
- **Issue:** Module not found (timeout.ts)
- **Root Cause:** Model extracted wrong filename (types.ts)

#### **task-029-fetch-json** (1 failure)
- **Issue:** Module not found (json-client.ts)
- **Root Cause:** Model extracted wrong filename (types.ts)

#### **task-031-build-entry** (5 failures)
- **Issue:** Module not found (main.ts, worker.ts)
- **Root Cause:** Model extracted wrong filename (build.ts instead of entrypoint files)

#### **task-033-build-outdir** (1 failure)
- **Issue:** Module not found (build.ts)
- **Root Cause:** Model extracted wrong filename (index.ts)

#### **task-034-build-minify** (7 failures)
- **Issue:** Module not found (utils.ts)
- **Root Cause:** Model extracted wrong filename (build.ts)

---

## 📊 Inference Quality Analysis

### Code Extraction Issues (Major Problem)

**9 tasks failed due to wrong filename extraction:**
- task-010, 012, 015, 019, 026, 027, 029, 031, 033, 034

**Pattern:** Model's code extraction heuristic guessed wrong filenames:
- Guessed `types.ts` when actual file was `client.ts`, `timeout.ts`, `json-client.ts`
- Guessed `code1.ts` when actual file was `writer.ts`, `checker.ts`
- Guessed `test.ts` when actual file was `operations.ts`
- Guessed `build.ts` when actual files were entrypoints

### Incomplete Inference (4 tasks)

**No code blocks found:**
- task-009-sqlite-bigint
- task-014-spawn-exitcode
- task-016-test-async
- task-017-mock-cleanup

### Logic Errors (5 tasks)

- task-006: Special character handling
- task-007: Transaction logic
- task-013: Windows compatibility
- task-018: Wrong assertion type
- task-021: Incomplete fix

### Platform Issues

**task-013:** Tests fail on Windows because they use Unix commands
- **Recommendation:** Skip this task on Windows or use cross-platform commands

---

## 🎯 Recommendations

### 1. Fix Code Extraction (HIGH PRIORITY)

The `extractFixedCode()` function in `run-evaluation.ts` needs better heuristics:
- Read the src/ directory to get actual filenames
- Don't guess - use the real filenames
- Match based on function names, exports, or content patterns

### 2. Re-run Failed Tasks

For the 9 tasks with filename extraction issues:
- Extract code correctly using actual filenames
- Re-evaluate to get accurate results

### 3. Handle Incomplete Inferences

For tasks 009, 014, 016, 017:
- Re-run inference with higher max_tokens or different prompt
- Or manually review and fix

### 4. Platform-Specific Tests

Skip task-013 on Windows or modify to use cross-platform commands

---

## 📝 Notes

- **Total tasks with inference:** 34
- **Tasks evaluated:** 29
- **Tasks without inference:** 46 (task-035 through task-080)
- **API Credit Status:** Exhausted - only ~357 tokens remaining

---

*Generated: 2025-02-10*
*Model: qwen/qwen3-next-80b-a3b-thinking*
*Platform: Windows*
