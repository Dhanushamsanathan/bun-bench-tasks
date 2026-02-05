/**
 * File existence checker module - FIXED VERSION
 *
 * This module provides utilities for checking file existence and properties.
 */

/**
 * Checks if a file exists at the given path.
 *
 * @param path - The file path to check
 * @returns True if file exists, false otherwise
 *
 * FIX: Use the proper exists() method instead of reading the file.
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = Bun.file(path);
  return await file.exists(); // FIX: Use exists() - efficient and correct!
}

/**
 * Gets file info if the file exists.
 *
 * @param path - The file path to check
 * @returns File info object or null if doesn't exist
 *
 * FIX: Use file.size for byte size, and exists() for existence check.
 */
export async function getFileInfo(path: string): Promise<{ size: number; exists: boolean } | null> {
  const file = Bun.file(path);

  // FIX: Check existence first
  if (!(await file.exists())) {
    return null;
  }

  return {
    size: file.size, // FIX: Use .size property for byte size (not string length!)
    exists: true,
  };
}

/**
 * Checks if a file exists and is readable.
 *
 * @param path - The file path to check
 * @returns True if file exists and is readable
 *
 * FIX: First check existence, then try to read a small chunk.
 */
export async function isReadable(path: string): Promise<boolean> {
  const file = Bun.file(path);

  // FIX: First check if file exists
  if (!(await file.exists())) {
    return false;
  }

  // For readability, we do need to try reading, but just a small chunk
  try {
    // Read just the first byte to test readability
    const stream = file.stream();
    const reader = stream.getReader();
    await reader.read();
    reader.releaseLock();
    return true;
  } catch {
    // File exists but can't be read (permission issue, etc.)
    return false;
  }
}

/**
 * Reads a file only if it exists, otherwise returns default value.
 *
 * @param path - The file path to read
 * @param defaultValue - Value to return if file doesn't exist
 * @returns File contents or default value
 *
 * FIX: Check existence first, then read. Only return default for non-existence.
 */
export async function readWithDefault(path: string, defaultValue: string): Promise<string> {
  const file = Bun.file(path);

  // FIX: Check existence first
  if (!(await file.exists())) {
    return defaultValue;
  }

  // File exists, try to read it
  // If read fails (permissions, etc.), let the error propagate
  return await file.text();
}

/**
 * Checks multiple files and returns which ones exist.
 *
 * @param paths - Array of file paths to check
 * @returns Object mapping paths to existence status
 *
 * FIX: Use parallel checking for better performance.
 */
export async function checkMultiple(paths: string[]): Promise<Record<string, boolean>> {
  // FIX: Check all files in parallel
  const results = await Promise.all(
    paths.map(async (path) => ({
      path,
      exists: await Bun.file(path).exists(),
    }))
  );

  // Convert to record
  return Object.fromEntries(results.map((r) => [r.path, r.exists]));
}

/**
 * Waits for a file to exist, with timeout.
 *
 * @param path - The file path to wait for
 * @param timeoutMs - Maximum time to wait
 * @param pollIntervalMs - How often to check
 * @returns True if file appeared, false if timed out
 *
 * FIX: Use efficient exists() check instead of reading the file.
 * NOTE: Create new Bun.file() reference each iteration to avoid caching.
 */
export async function waitForFile(
  path: string,
  timeoutMs: number = 5000,
  pollIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // FIX: Use efficient exists() check
    // Create new file reference each time to avoid any caching
    if (await Bun.file(path).exists()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}
