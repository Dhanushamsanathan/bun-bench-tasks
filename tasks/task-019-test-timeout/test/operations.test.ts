import { test, expect, describe } from "bun:test";
import {
  slowNetworkRequest,
  retryUntilSuccess,
  pollForCondition,
  processItems,
  unreliableOperation,
  fetchWithTimeout,
} from "../src/operations";

describe("slowNetworkRequest", () => {
  // BUG: No timeout configured - test will take 3 seconds by default
  test("returns response data", async () => {
    const result = await slowNetworkRequest(); // Takes 3000ms!
    expect(result.data).toBe("response");
  });

  // BUG: Even slower request, may exceed default timeout in CI
  test("handles long delays", async () => {
    const result = await slowNetworkRequest(6000); // Takes 6 seconds!
    expect(result.data).toBe("response");
  });
});

describe("retryUntilSuccess", () => {
  // BUG: This test will hang forever if condition never becomes true!
  test("retries until success", async () => {
    let attempts = 0;
    const result = await retryUntilSuccess(() => {
      attempts++;
      return attempts >= 5;
    });
    expect(result).toBe(true);
  });

  // BUG: If this condition never becomes true, test hangs forever
  test("keeps retrying with slow interval", async () => {
    let counter = 0;
    // What if we accidentally use wrong condition?
    const result = await retryUntilSuccess(
      () => {
        counter++;
        return counter > 3; // Should be > not >= but still works
      },
      200 // 200ms interval, total ~800ms but no timeout!
    );
    expect(result).toBe(true);
  });
});

describe("pollForCondition", () => {
  // BUG: No timeout, relies on internal defaults
  test("polls until condition is met", async () => {
    let value = false;
    setTimeout(() => {
      value = true;
    }, 500);

    const result = await pollForCondition(() => value);
    expect(result).toBe(true);
  });

  // BUG: Max attempts but no test-level timeout
  test("respects max attempts", async () => {
    let calls = 0;
    const result = await pollForCondition(
      () => {
        calls++;
        return false; // Never true
      },
      { maxAttempts: 10, intervalMs: 100 } // 1 second total, but no test timeout
    );
    expect(result).toBe(false);
  });
});

describe("processItems", () => {
  // BUG: Processing 10 items at 500ms each = 5 seconds! No timeout configured
  test("processes all items", async () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    const results = await processItems(items);
    expect(results).toHaveLength(10);
  });

  // BUG: Even longer processing with custom delay
  test("processes items with custom delay", async () => {
    const items = ["x", "y", "z"];
    const results = await processItems(items, 2000); // 6 seconds total!
    expect(results).toHaveLength(3);
  });
});

describe("unreliableOperation", () => {
  // BUG: This operation takes 10 seconds with no timeout!
  test("completes operation", async () => {
    const result = await unreliableOperation();
    expect(result).toBe("completed");
  });
});

describe("fetchWithTimeout", () => {
  // BUG: Random delay up to 10 seconds, test has no timeout
  test("fetches data from URL", async () => {
    const result = await fetchWithTimeout("https://api.example.com/data");
    expect(result.status).toBeDefined();
  });

  // BUG: Long timeout value, test may take forever
  test("handles slow responses", async () => {
    const result = await fetchWithTimeout("https://slow.api.com", 15000);
    expect(result).toBeDefined();
  });
});
