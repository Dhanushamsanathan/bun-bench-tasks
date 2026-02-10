/**
 * Operations that may take variable amounts of time.
 */

/**
 * Simulates a slow network request.
 */
export async function slowNetworkRequest(delayMs: number = 3000): Promise<{ data: string }> {
  await Bun.sleep(delayMs);
  return { data: "response" };
}

/**
 * Retries an operation until it succeeds.
 * WARNING: Can loop forever if condition is never met!
 */
export async function retryUntilSuccess(
  shouldSucceed: () => boolean,
  intervalMs: number = 100
): Promise<boolean> {
  // BUG: No maximum retry count!
  while (!shouldSucceed()) {
    await Bun.sleep(intervalMs);
  }
  return true;
}

/**
 * Polls for a condition with configurable options.
 */
export async function pollForCondition(
  check: () => boolean | Promise<boolean>,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    timeoutMs?: number;
  } = {}
): Promise<boolean> {
  const { intervalMs = 100, maxAttempts = Infinity, timeoutMs = Infinity } = options;
  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("Polling timed out");
    }

    const result = await check();
    if (result) return true;

    attempts++;
    await Bun.sleep(intervalMs);
  }

  return false;
}

/**
 * Processes items with artificial delay.
 */
export async function processItems(items: string[], delayPerItem: number = 500): Promise<string[]> {
  const results: string[] = [];
  for (const item of items) {
    await Bun.sleep(delayPerItem);
    results.push(`processed-${item}`);
  }
  return results;
}

/**
 * Simulates an operation that may hang.
 */
export async function unreliableOperation(signal?: AbortSignal): Promise<string> {
  // Simulate checking for abort
  if (signal?.aborted) {
    throw new Error("Operation aborted");
  }

  // This could hang if something goes wrong
  await Bun.sleep(10000);

  return "completed";
}

/**
 * Fetches data with built-in timeout.
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 5000
): Promise<{ status: "ok" | "timeout"; data?: unknown }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Simulate fetch - in real code this would be actual fetch
    await Bun.sleep(Math.random() * 10000);
    clearTimeout(timeoutId);
    return { status: "ok", data: { url } };
  } catch {
    clearTimeout(timeoutId);
    return { status: "timeout" };
  }
}
