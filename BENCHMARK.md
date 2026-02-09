# Bun Benchmark - AI Model Evaluation Pipeline

This is a benchmark evaluation system for testing AI models (like Qwen via OpenRouter) on fixing buggy Bun.js code.

## Architecture

```
Task Directory (tasks/task-001-content-length/)
├── README.md          ← Problem description
├── src/*.ts           ← Buggy code (intentionally broken)
├── test/*.test.ts     ← Tests that fail on buggy code, pass when fixed
└── solution/*.ts      ← Reference solution

Pipeline:
  1. INFERENCE  → Send src/ + README to AI model → Get fixed code back
  2. EVALUATION → Apply fix to src/ → Run bun test → Record pass/fail
  3. REPORT     → Aggregate results → Generate metrics
```

## Quick Start

### Setup

```bash
# Ensure .env has your OpenRouter credentials
cat .env
# Should show:
#   OPENROUTER_API_KEY=sk-or-v1-...
#   OPENROUTER_MODEL=qwen/qwen3-next-80b-a3b-thinking
```

### Run Single Task

Test one task from inference through evaluation:

```bash
# Run inference (query the model)
bun run scripts/run-inference.ts task-001-content-length

# Run evaluation (apply fix and verify tests pass)
bun run scripts/run-evaluation.ts task-001-content-length
```

This will:
1. Save the model's response to `tasks/task-001-content-length/inference-response.json`
2. Extract fixed code from the response
3. Apply it to `src/`
4. Run `bun test`
5. Report pass/fail rate

### Run Full Benchmark (First 3 Tasks)

```bash
bun run scripts/benchmark.ts
```

Or test just a few tasks:

```bash
bun run scripts/benchmark.ts task-001
bun run scripts/benchmark.ts task-006
```

### Run All 80 Tasks

⚠️ **Warning**: This will make 80 API calls to OpenRouter. Will take ~10-20 minutes.

```bash
bun run scripts/benchmark.ts all
```

## Understanding the Output

### Inference Output

```
[1/3] task-001-content-length
  📖 Reading README and source code...
  📡 Calling OpenRouter (model: qwen/qwen3-next-80b-a3b-thinking)...
    ✅ Saved to inference-response.json
```

### Evaluation Output

```
[1/3] task-001-content-length
  🔍 Extracting fixed code...
  📝 Found 1 file(s) to fix
  ✏️  Applying fixes...
    Fixed: server.ts
  🧪 Running tests...
  ✅ PASSED (154ms)
```

### Final Report

```
============================================================
BENCHMARK SUMMARY
============================================================
Model:              qwen/qwen3-next-80b-a3b-thinking
Total Tasks:        80
With Inference:     80
Passed Evaluation:  54 ✅
Failed Evaluation:  26 ❌
Success Rate:       67.5%
Total Duration:     523.2s
============================================================

📝 Full report saved to: benchmark-report.json
```

## Understanding the Model's Response Format

The model must return fixed code in this format:

```typescript
```typescript
// File: src/server.ts
export function handler(req: Request) {
  // Fixed code here
  return new Response("Hello");
}
```

The evaluation script looks for:
- Code blocks wrapped in ` ```typescript ... ``` `
- File comment: `// File: src/filename.ts`
- Extracts the code between comment and block boundary

## Checking Results

### View inference response:

```bash
cat tasks/task-001-content-length/inference-response.json
```

### View benchmark report:

```bash
cat benchmark-report.json
```

## Advanced Usage

### Run inference but skip a task with existing response:

The script automatically detects `inference-response.json` files. To re-run a task, delete its response file:

```bash
rm tasks/task-006-sqlite-params/inference-response.json
bun run scripts/run-inference.ts task-006-sqlite-params
```

### Test with different model:

```bash
export OPENROUTER_MODEL=claude-3-5-sonnet-20241022
bun run scripts/run-inference.ts task-001-content-length
```

### Run evaluation without inference:

If you already have `inference-response.json` files, skip inference:

```bash
# Just evaluate previously-inferred tasks
bun run scripts/run-evaluation.ts task-001-content-length
```

## Metrics Explained

| Metric | Meaning |
|--------|---------|
| **Total Tasks** | Number of benchmark tasks to run |
| **With Inference** | Tasks where model successfully generated a response |
| **Passed Evaluation** | Tasks where model's fix passed all tests |
| **Failed Evaluation** | Tasks where model's fix still failed some tests |
| **Success Rate** | Passed / Total Tasks (%) |

## Troubleshooting

### "OPENROUTER_API_KEY not set"

→ Check your `.env` file has the key set

### "Cannot find code blocks in response"

→ Model response format is wrong. Check the JSON in `inference-response.json` -> `response` field

### "Tests still failing after applying fix"

→ Model didn't generate correct fix. Check the diff between original and applied code

### Windows command issues (cp, ls, etc)

The scripts use Bun's `$` shell, which works on both Windows and Unix. Some issues may occur with paths on Windows — report them!

## File Structure

```
scripts/
├── benchmark.ts          ← Main orchestration
├── run-inference.ts      ← Query the model
├── run-evaluation.ts     ← Apply fix & test
└── test-solutions.ts     ← Legacy: test reference solutions

tasks/
├── task-001-content-length/
│   ├── README.md
│   ├── src/
│   ├── test/
│   ├── solution/
│   └── inference-response.json  ← Created by run-inference.ts
├── task-002-json-content-type/
│   └── ...
└── ... (80 total)
```

## Next Steps

Try running a quick test:

```bash
bun run scripts/run-inference.ts task-001-content-length task-002-json-content-type
bun run scripts/run-evaluation.ts task-001-content-length task-002-json-content-type
```

Then check the results in `benchmark-report.json`!
