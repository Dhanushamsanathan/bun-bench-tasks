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
 * Retries an operation until it succeeds with a default retry limit.
 */
export async function retryUntilSuccess(
  shouldSucceed: () => boolean,
  options: {
    intervalMs?: number;
    maxRetries?: number;
  } = {}
): Promise<boolean> {
  const { intervalMs = 100, maxRetries = 10 } = options;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (shouldSucceed()) {
      return true;
    }
    await Bun.sleep(intervalMs);
  }
  return false;
}

/**
 * Polls for a condition with configurable options and safe defaults.
 */
export async function pollForCondition(
  check: () => boolean | Promise<boolean>,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    timeoutMs?: number;
  } = {}
): Promise<boolean> {
  const { intervalMs = 100, maxAttempts = 100, timeoutMs = 5000 } = options;
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
 * Simulates an operation that may hang with proper abort handling.
 */
export async function unreliableOperation(signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve("completed");
    }, 10000);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Operation aborted'));
      });
    }
  });
}

/**
 * Fetches data with built-in timeout and proper abort handling.
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 5000
): Promise<{ status: "ok" | "timeout"; data?: unknown }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await new Promise<void>((resolve, reject) => {
      const sleepTimer = setTimeout(resolve, Math.random() * 10000);
      controller.signal.addEventListener('abort', () => {
        clearTimeout(sleepTimer);
        reject(new Error('Aborted'));
      });
    });
    clearTimeout(timeoutId);
    return { status: "ok", data: { url } };
  } catch {
    clearTimeout(timeoutId);
    return { status: "timeout" };
  }
}