# 📊 Console Output Guide

## What You'll See in Console

### Normal Mode
```bash
bun run benchmark task-009-sqlite-bigint
```

**Output:**
```
[task-009-sqlite-bigint]
  🔄 Attempt 1/3
  📝 Sending prompt to AI (1245 chars, 0 previous errors)
  📡 AI Response (15000ms, 4601 tokens)
  📝 Found 1 file(s) to fix
  🧪 Running tests...
  ❌ FAILED - test_failure [3/11 tests]
     Error: expected "olleH" but got "hello"

  🔄 Attempt 2/3
  📝 Sending prompt to AI (1456 chars, 1 previous errors)
  📋 Error feedback included (1 errors)
  ┌────────────────────────────────────────┐
  │ Last Error (preview):                  │
  └────────────────────────────────────────┘
  │ **Error Type:** test_failure           │
  │ **Tests:** 3/11 passed                 │
  │ **Test Failures:** 8 tests failed       │
  │ **Error Details:**                      │
  └────────────────────────────────────────┘

  📡 AI Response (12000ms, 4500 tokens)
  ✅ PASSED (150ms) [11/11 tests]
```

---

### Show Prompt Mode (--show-prompt)
```bash
bun run benchmark task-009-sqlite-bigint --show-prompt
```

**Output:**
```
[task-009-sqlite-bigint]
  🔄 Attempt 2/3
  📝 Sending prompt to AI (1456 chars, 1 previous errors)

  ╔════════════════════════════════════════════════════════════╗
  ║ FULL PROMPT TO AI:                                            ║
  ╚════════════════════════════════════════════════════════════╝
  ║ You are a Bun.js expert. Your task is to fix the buggy code  ║
  ║ in this task.                                                ║
  ║                                                              ║
  ║ Task: task-009-sqlite-bigint                               ║
  ║                                                              ║
  ║ ## Problem Description                                      ║
  ║ # Task 009: BigInt Columns                                  ║
  ║ ...                                                          ║
  ║                                                              ║
  ║ ## ⚠️ Previous Attempt Failed                              ║
  ║                                                              ║
  ║ ### Attempt 1 Error:                                        ║
  ║ **Error Type:** test_failure                                ║
  ║ **Tests:** 3/11 passed                                      ║
  ║ **Test Failures:** 8 tests failed                            ║
  ║ **Error Details:**                                           ║
  ║ ```                                                          ║
  ║ expected: 1000000000000n                                    ║
  ║ received: 1000000000000                                      ║
  ║ ...                                                          ║
  ║ ```                                                          ║
  ║                                                              ║
  ╚════════════════════════════════════════════════════════════╝

  📡 AI Response (12000ms, 4500 tokens)
```

---

## 📋 Console Elements Explained

| Icon | Meaning |
|------|---------|
| 🔄 | Starting an attempt |
| 📝 | Sending prompt to AI (shows character count) |
| 📡 | AI responded (shows time and tokens) |
| 📝 Found X files | AI generated X files to fix |
| 🧪 | Running tests |
| ✅ PASSED | All tests passed |
| ❌ FAILED | Tests failed (shows error type) |
| ⏭️ Skipped | Max attempts reached |
| 💾 | Saved debug file |

---

## 🔍 Debug Files Created

After each attempt, you'll find:
```
tasks/task-009-sqlite-bigint/
├── attempt-1.json          # First try (full prompt + response)
├── attempt-2.json          # First retry (with error feedback)
├── attempt-3.json          # Second retry (with all errors)
├── inference-response.json # Final result (if passed)
└── evaluation-result.json # Test results (if passed)
```

**Check attempt files to see:**
- `prompt` - What was sent to AI
- `response` - What AI replied
- `tokensUsed` - How many tokens it cost

---

## 📊 Error Feedback Format

The AI receives ALL test failures in this format:

```
## ⚠️ Previous Attempt Failed

### Attempt 1 Error:
**Error Type:** test_failure
**Tests:** 3/11 passed
**Test Failures:** 8 tests failed
**Error Details:**
```
expected: 1000000000000n
received: 1000000000000

expected: 1770723045475000000n
received: 1770723045475000064

... (all 8 failures shown)
```

Please analyze these errors and fix the issues in your next attempt.
```

---

## 🎯 Usage Examples

### Normal run (recommended)
```bash
bun run benchmark task-009
```

### See what's being sent to AI
```bash
bun run benchmark task-009 --show-prompt
```

### Verbose mode (extra details)
```bash
bun run benchmark task-009 --verbose
```

### Run all tasks with prompt preview
```bash
bun run benchmark all --show-prompt
```

---

## 💡 Key Points

1. **ALL test failures are shown** to AI (not just 2)
2. Console shows **preview** of error feedback
3. Use `--show-prompt` to see **full prompt** being sent
4. Each attempt saved to `attempt-N.json` for inspection
5. AI gets **complete error information** to fix properly

---

**Why this works better:**
- ✅ AI sees ALL failures (not overwhelmed, just compact)
- ✅ Error format is clean and structured
- ✅ You can inspect exactly what was sent/received
- ✅ Can debug why AI isn't generating code
