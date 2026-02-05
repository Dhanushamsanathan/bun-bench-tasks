/**
 * File existence checker module
 *
 * This module provides utilities for checking file existence and properties.
 */

/**
 * Checks if a file exists at the given path.
 *
 * @param path - The file path to check
 * @returns True if file exists, false otherwise
 *
 * BUG: Using try/catch on read instead of proper exists() check.
 * This is inefficient and treats all errors as "not exists".
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const file = Bun.file(path);
    await file.text(); // BUG: Reading entire file just to check existence!
    return true;
  } catch {
    return false; // BUG: All errors treated as "doesn't exist"
  }
}

/**
 * Gets file info if the file exists.
 *
 * @param path - The file path to check
 * @returns File info object or null if doesn't exist
 *
 * BUG: Inefficient - reads entire file content just to get metadata.
 */
export async function getFileInfo(path: string): Promise<{ size: number; exists: boolean } | null> {
  try {
    const file = Bun.file(path);
    const content = await file.text(); // BUG: Reading entire file!

    return {
      size: content.length, // BUG: This is string length, not byte size!
      exists: true,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a file exists and is readable.
 *
 * @param path - The file path to check
 * @returns True if file exists and is readable
 *
 * BUG: Can't distinguish between "doesn't exist" and "exists but not readable".
 */
export async function isReadable(path: string): Promise<boolean> {
  try {
    const file = Bun.file(path);
    await file.text(); // BUG: Reading entire file for readability check
    return true;
  } catch {
    return false; // BUG: Permission denied would also return false
  }
}

/**
 * Reads a file only if it exists, otherwise returns default value.
 *
 * @param path - The file path to read
 * @param defaultValue - Value to return if file doesn't exist
 * @returns File contents or default value
 */
export async function readWithDefault(path: string, defaultValue: string): Promise<string> {
  try {
    const file = Bun.file(path);
    return await file.text();
  } catch {
    // BUG: Any error returns default, not just "file not found"
    return defaultValue;
  }
}

/**
 * Checks multiple files and returns which ones exist.
 *
 * @param paths - Array of file paths to check
 * @returns Object mapping paths to existence status
 */
export async function checkMultiple(paths: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const path of paths) {
    // BUG: Sequential and inefficient - reads each file fully
    results[path] = await fileExists(path);
  }

  return results;
}

/**
 * Waits for a file to exist, with timeout.
 *
 * @param path - The file path to wait for
 * @param timeoutMs - Maximum time to wait
 * @param pollIntervalMs - How often to check
 * @returns True if file appeared, false if timed out
 */
export async function waitForFile(
  path: string,
  timeoutMs: number = 5000,
  pollIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // BUG: Using inefficient fileExists which reads entire file each poll
    if (await fileExists(path)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}
