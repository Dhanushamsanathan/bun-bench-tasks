/**
 * Data persistence module
 *
 * This module provides utilities for saving and loading data to files.
 */

/**
 * Saves data to a file.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 *
 * BUG: Bun.write() returns a Promise but we don't await it!
 * The file write operation starts but doesn't complete before the function returns.
 */
export async function saveData(path: string, data: string): Promise<void> {
  Bun.write(path, data); // BUG: Missing await!
  // Function returns immediately while write is still in progress
}

/**
 * Saves data and returns the bytes written.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 * @returns The number of bytes written
 *
 * BUG: Returns string length instead of actual bytes written!
 * This is wrong for unicode content and doesn't verify the write succeeded.
 */
export async function saveDataWithCount(path: string, data: string): Promise<number> {
  Bun.write(path, data); // BUG: Missing await - write may not complete!
  return data.length; // BUG: Returns string length, not bytes written by Bun.write!
}

/**
 * Saves data to a file and immediately reads it back for verification.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 * @returns The data that was read back from the file
 */
export async function saveAndVerify(path: string, data: string): Promise<string> {
  Bun.write(path, data); // BUG: Not awaited!

  // This read happens before the write completes!
  const file = Bun.file(path);
  const content = await file.text();

  return content;
}

/**
 * Saves multiple pieces of data to different files.
 *
 * @param entries - Array of [path, data] tuples
 */
export async function saveMultiple(entries: [string, string][]): Promise<void> {
  for (const [path, data] of entries) {
    Bun.write(path, data); // BUG: Not awaited in loop!
  }
  // All writes started but none guaranteed to be complete
}

/**
 * Appends data to a file by reading, concatenating, and writing.
 *
 * @param path - The file path
 * @param data - The data to append
 */
export async function appendData(path: string, data: string): Promise<void> {
  const file = Bun.file(path);
  let existing = "";

  try {
    existing = await file.text();
  } catch {
    // File doesn't exist, that's ok
  }

  Bun.write(path, existing + data); // BUG: Not awaited!
}
