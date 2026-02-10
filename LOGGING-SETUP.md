# Benchmark Logging Setup

## Overview

The benchmark script now automatically saves detailed logs for all 3 steps of the pipeline.

## Log Files Generated

When you run `bun run scripts/benchmark.ts`, the following logs will be created in the `logs/` directory:

### 📡 **Step 1: Inference Log**
- **File:** `logs/step1-inference-{timestamp}.txt`
- **Contents:**
  - All API calls to OpenRouter
  - Model responses for each task
  - Inference duration per task
  - Any API errors or credit issues
  - Progress: [X/80] task-name

### 📚 **Step 2: Evaluation Log**
- **File:** `logs/step2-evaluation-{timestamp}.txt`
- **Contents:**
  - Code extraction from model responses
  - Applied fixes to src/ files
  - Test results (pass/fail)
  - Error messages for failing tests
  - Progress: [X/80] task-name

### 📊 **Step 3: Report Generation Log**
- **File:** `logs/step3-report-{timestamp}.txt`
- **Contents:**
  - Final benchmark summary
  - Success rate statistics
  - Total inference time
  - Total duration
  - Reference to full JSON report

## Additional Output Files

### 📝 **benchmark-report.json**
- Complete JSON report with all task details
- Includes inference duration, evaluation results, errors
- Can be parsed for custom analysis

### 📋 **evaluation-result.json** (per task)
- Individual task evaluation results
- Saved in each task directory: `tasks/task-XXX/evaluation-result.json`

### 🤖 **inference-response.json** (per task)
- Individual task inference responses
- Saved in each task directory: `tasks/task-XXX/inference-response.json`

## Example Directory Structure

```
bun-bench-tasks/
├── logs/
│   ├── step1-inference-1739218400000.txt
│   ├── step2-evaluation-1739218600000.txt
│   └── step3-report-1739218650000.txt
├── benchmark-report.json
├── EVALUATION-REPORT.md
└── tasks/
    ├── task-001-content-length/
    │   ├── inference-response.json
    │   └── evaluation-result.json
    ├── task-002-json-content-type/
    │   ├── inference-response.json
    │   └── evaluation-result.json
    └── ...
```

## Usage

Run the complete benchmark:

```bash
bun run scripts/benchmark.ts
```

After completion, check the logs:

```bash
# List all log files
ls -la logs/

# View inference log
cat logs/step1-inference-*.txt

# View evaluation log
cat logs/step2-evaluation-*.txt

# View report summary
cat logs/step3-report-*.txt
```

## Log Rotation

Each run creates NEW log files with timestamps, so you never lose historical data.

To clean up old logs:

```bash
# Remove all logs
rm -rf logs/

# Or keep only the latest
ls -t logs/* | tail -n +4 | xargs rm --
```

## Timestamp Format

Timestamps are in milliseconds since epoch (Date.now()), e.g.:
- `1739218400000` = 2025-02-10 around 12:00 UTC

---

*Setup completed: 2025-02-10*
