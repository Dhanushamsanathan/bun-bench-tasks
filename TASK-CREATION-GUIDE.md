# Creating New Tasks (081-180) - Phase 2

## 📁 Location

**New tasks are created in `tasks-advanced/` directory**

This keeps them separate from the original 80 tasks in `tasks/`.

## Quick Start

Generate all 100 task directories:

```bash
bun run scripts/generate-tasks.ts
```

This will create **tasks-advanced/task-081-*** through **tasks-advanced/task-180-*** with template structure.

---

## What Gets Generated

For each bug in `bun-bug-fix.txt`, the script creates:

```
tasks-advanced/task-081-name/
├── README.md              # Problem description (template)
├── src/
│   └── index.ts          # Buggy implementation (TODO)
├── test/
│   └── index.test.ts     # Tests (TODO)
└── solution/
    └── index.ts          # Fixed implementation (TODO)
```

---

## Structure Overview

```
bun-bench-tasks/
├── tasks/                 # Phase 1: Original 80 tasks
│   ├── task-001-*/       # Basic to intermediate
│   └── task-080-*/
│
└── tasks-advanced/        # Phase 2: New 100 tasks 👈 YOU ARE HERE
    ├── task-081-*/       # Intermediate to advanced
    ├── task-121-*/       # Database (PostgreSQL/MySQL)
    ├── task-161-*/       # Expert level
    └── task-180-*/
```

---

## Filling in the Content

### Step 1: Implement Buggy Code (`src/index.ts`)

**Goal:** Create code that demonstrates the bug

```typescript
/**
 * Task 081: Content-Length UTF-8 Bug
 *
 * BUG: Uses string.length instead of byte length for Content-Length
 */
import { Bun } from "bun";

export function createResponse(body: string): Response {
  // BUG: This returns character count, not byte count
  const contentLength = body.length;

  return new Response(body, {
    headers: {
      "Content-Length": contentLength.toString(),
    },
  });
}
```

### Step 2: Write Tests (`test/index.test.ts`)

**Goal:** Tests that FAIL with buggy code, PASS with solution

```typescript
import { describe, it, expect } from "bun:test";
import { createResponse } from "../src/index";

describe("Content-Length UTF-8 Bug", () => {
  it("should return correct Content-Length for ASCII", () => {
    const res = createResponse("hello");
    expect(res.headers.get("Content-Length")).toBe("5");
  });

  it("should return correct Content-Length for UTF-8 multi-byte", () => {
    const res = createResponse("こんにちは"); // 5 chars × 3 bytes = 15
    expect(res.headers.get("Content-Length")).toBe("15");
  });
});
```

### Step 3: Implement Solution (`solution/index.ts`)

**Goal:** Fixed code that passes all tests

```typescript
/**
 * Task 081: Content-Length UTF-8 Bug - FIXED
 *
 * FIX: Use Buffer.byteLength() for correct byte count
 */
import { Bun } from "bun";

export function createResponse(body: string): Response {
  // FIX: Calculate actual byte length for UTF-8
  const contentLength = Buffer.byteLength(body, "utf-8");

  return new Response(body, {
    headers: {
      "Content-Length": contentLength.toString(),
    },
  });
}
```

### Step 4: Verify

```bash
cd tasks/task-081-content-length-utf8

# Should fail with buggy code
bun test

# Copy solution to test
cp solution/index.ts src/index.ts

# Should pass now
bun test
```

---

## Task Creation Best Practices

### 1. **Keep It Simple**

❌ **Bad:** Complex setup with multiple files
✅ **Good:** Single function demonstrating the bug

### 2. **Clear Test Failures**

❌ **Bad:** Test fails with unclear error
✅ **Good:** Test fails with obvious assertion mismatch

```typescript
// Good test failure
expect(contentLength).toBe(15); // Error: Expected 15, got 5
```

### 3. **Minimal Reproduction**

Focus on the core bug, don't add unnecessary complexity:

❌ **Bad:** Full server setup, database, auth
✅ **Good:** Just the problematic function

### 4. **Describe Bug in Comments**

Always document what the bug is:

```typescript
// BUG: Using string.length instead of byte length
// This works for ASCII but fails for multi-byte UTF-8
const length = str.length; // BUGGY
```

### 5. **Isolate the Issue**

Each task should test ONE specific bug:

❌ **Bad:** Tests 5 different bugs in one task
✅ **Good:** One task = one bug

---

## Task Difficulty Levels

### 🟢 **Simple Tasks** (20-30 min)
- Single function fix
- Obvious bug (wrong API, missing await)
- 2-3 test cases

**Examples:**
- Content-Length calculation
- Missing await on async operation
- Wrong query method (.get vs .all)

### 🟡 **Medium Tasks** (1-2 hours)
- Multiple related functions
- Requires understanding Bun internals
- 3-5 test cases

**Examples:**
- WebSocket message handling
- FormData parsing edge cases
- File watcher configuration

### 🔴 **Complex Tasks** (3-5 hours)
- Database integration
- System-level programming
- Multiple edge cases
- 5-10 test cases

**Examples:**
- PostgreSQL connection pooling
- Process group management
- SSL certificate chain handling

---

## Common Patterns

### Pattern 1: Wrong API Usage

```typescript
// Buggy
const length = str.length;

// Fixed
const length = Buffer.byteLength(str, "utf-8");
```

### Pattern 2: Missing Error Handling

```typescript
// Buggy
const proc = Bun.spawn(cmd);
return proc.exitCode;

// Fixed
const proc = Bun.spawn(cmd);
await proc.exited;
return proc.exitCode;
```

### Pattern 3: Incorrect Query Method

```typescript
// Buggy
return db.query("SELECT * FROM users").get();

// Fixed
return db.query("SELECT * FROM users").all();
```

### Pattern 4: Type Conversion Issue

```typescript
// Buggy
const size = file.text().length;

// Fixed
const size = new TextEncoder().encode(file.text()).length;
```

---

## Testing Your Tasks

Before committing, verify:

1. ✅ **Buggy code fails tests**
   ```bash
   cd task-XXX
   bun test  # Should FAIL
   ```

2. ✅ **Solution passes tests**
   ```bash
   cp solution/index.ts src/index.ts
   bun test  # Should PASS
   ```

3. ✅ **Tests are clear**
   - Failure message is obvious
   - Test describes what it's checking

4. ✅ **README is complete**
   - Problem description clear
   - Steps to reproduce provided

---

## Running the Full Benchmark

After creating tasks:

```bash
# Run inference on all tasks (001-180)
bun run scripts/benchmark.ts

# Or run specific range
bun run scripts/benchmark.ts | grep "task-0[89]"
```

---

## Progress Tracking

Track which tasks are complete:

```bash
# Count completed tasks (have solution)
ls tasks/task-*/solution/*.ts | wc -l

# Count tasks with tests
ls tasks/task-*/test/*.test.ts | wc -l
```

---

## Tips for Specific Categories

### Database Tasks (PostgreSQL/MySQL)

```typescript
// Setup test database
const db = new Database(":memory:");

// Clean up after each test
afterEach(() => {
  db.run("DELETE FROM users");
});
```

### WebSocket Tasks

```typescript
// Use Bun's built-in test server
const server = Bun.serve({
  fetch(req) {
    if (req.headers.get("Upgrade") === "websocket") {
      return server.upgrade(req);
    }
  },
  websocket: {
    message(ws, msg) {},
    close(ws) {},
  },
});

afterAll(() => server.stop());
```

### File System Tasks

```typescript
// Use temp directory
const tmpDir = `/tmp/task-${Date.now()}`;

afterAll(() => {
  rmSync(tmpDir, { recursive: true });
});
```

---

## Getting Help

- Check existing tasks (001-080) for examples
- Look at `CLAUDE.md` for project guidelines
- Each task should be self-contained and runnable

---

*Created: 2025-02-10*
*Total Tasks to Generate: 100*
*Numbering: task-081 through task-180*
