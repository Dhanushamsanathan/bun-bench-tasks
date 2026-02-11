# 🚀 New Benchmark Workflow Guide

## What's New?

**Task-by-task completion** with **intelligent retry** based on real test errors.

---

## 📊 Workflow Comparison

### Old Way (Two-Phase)
```
Phase 1: Run inference on ALL tasks
  → Saves all AI responses
  → No test feedback

Phase 2: Run evaluation on ALL tasks
  → Tests all responses
  → No retry with feedback
```

### New Way (Task-by-Task)
```
For EACH task:
  1. Attempt 1: Generate fix → Test
  2. If failed → Attempt 2: Generate fix (with error feedback) → Test
  3. If failed → Attempt 3: Generate fix (with all errors) → Test
  4. If still failed → Skip to next task
  5. If passed → Move to next task ✓
```

---

## 🎯 Key Improvements

### 1. Test-Based Retry (Not Just Syntax)
- **Old**: Retry only on syntax errors
- **New**: Retry on ANY test failure with detailed error messages

### 2. Error Feedback Loop
- AI sees exactly what went wrong:
  ```
  **Error Type:** test_failure
  **Tests:** 2/5 passed
  **Error Details:**
  expected "olleH" but got "hello"
  ```

### 3. Complete One Task Before Moving On
- Ensures quality over quantity
- Better progress tracking
- Can stop/resume anytime

---

## 📝 Usage

### Run Complete Benchmark
```bash
# Process all 80 tasks with intelligent retry
bun run benchmark all
```

### Run Specific Tasks
```bash
# Run specific tasks
bun run benchmark task-001-content-length task-002-json-content-type
```

### Resume from Where You Left Off
```bash
# Automatically skips completed tasks
bun run benchmark all
```

---

## 📊 Output Format

```
============================================================
Task 1/80: task-001-content-length
============================================================

[task-001-content-length]
  🔄 Attempt 1/3
  📡 AI Response (15000ms, 1234 tokens)
  📝 Found 1 file(s) to fix
  🧪 Running tests...
  ❌ FAILED - test_failure [2/5 tests]
     Error: Expected "olleH" but got "hello"

  🔄 Attempt 2/3
  📡 AI Response (12000ms, 1100 tokens)
  📝 Found 1 file(s) to fix
  🧪 Running tests...
  ✅ PASSED (150ms) [5/5 tests]

============================================================
Task 2/80: task-002-json-content-type
============================================================
```

---

## 🎯 Features

✅ **Task-by-task completion** - Done
✅ **Test-based retry** - Real errors, not just syntax
✅ **Error feedback loop** - AI learns from mistakes
✅ **Max 3 attempts** - Then skip
✅ **Skip completed tasks** - Resume support
✅ **Progress tracking** - Clear console output
✅ **Source preservation** - Restores original code after each test

---

## 📁 Files

### New Script
- `scripts/run-benchmark.ts` - Main workflow (recommended)

### Existing Scripts (Still Work)
- `scripts/run-inference.ts` - Standalone inference
- `scripts/run-evaluation.ts` - Standalone evaluation

---

## 💡 When to Use Each Script

### Use `bun run benchmark` (Recommended)
- Running full benchmark
- Want intelligent retry with test feedback
- Task-by-task progress

### Use `bun run inference` + `bun run evaluate`
- Already have some results
- Want to run in two phases
- Don't need retry feedback

---

## 🔧 How It Works

### 1. Read Task Files
```
- README.md (problem description)
- src/*.ts (buggy code)
```

### 2. First Attempt
```typescript
// Prompt: README + buggy code
→ AI generates fix
→ Apply fix
→ Run tests
→ Pass? ✓ Done
→ Fail? Continue →
```

### 3. Second Attempt (With Feedback)
```typescript
// Prompt: README + buggy code + ERROR MESSAGE
→ AI sees what went wrong
→ AI generates improved fix
→ Apply fix
→ Run tests
→ Pass? ✓ Done
→ Fail? Continue →
```

### 4. Third Attempt (With All Errors)
```typescript
// Prompt: README + buggy code + ALL PREVIOUS ERRORS
→ AI sees full error history
→ AI generates final fix
→ Apply fix
→ Run tests
→ Pass? ✓ Done
→ Fail? ⏭️ Skip to next task
```

---

## 📈 Progress Tracking

The script shows:
- Current task number (X/80)
- Attempt number (1/3, 2/3, 3/3)
- AI response time and token usage
- Test results (passed/total)
- Error type and details
- Final status (✅ PASSED or ⏭️ Skipped)

---

## ⏭️ Skipping Logic

Tasks are skipped if:
1. Already passed (has evaluation-result.json with passed: true)
2. Failed all 3 attempts

---

## 🔄 Resume Capability

```bash
# Run 20 tasks, then stop (Ctrl+C)
bun run benchmark all

# Later, resume - it will skip the 20 completed tasks
bun run benchmark all
```

---

## 💾 Output Files

For each task:
- `inference-response.json` - AI's final response
- `evaluation-result.json` - Test results

---

## 🎉 Summary

After completion:
```
============================================================
BENCHMARK SUMMARY
============================================================
Passed:   45 ✅
Failed:   25 ❌
Skipped:  10 ⏭️
Success:  64.3%
============================================================
```

---

**Status**: ✅ Ready to use
**Version**: 2.0
**Command**: `bun run benchmark all`
