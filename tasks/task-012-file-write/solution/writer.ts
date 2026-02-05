/**
 * Data persistence module - FIXED VERSION
 *
 * This module provides utilities for saving and loading data to files.
 */

/**
 * Saves data to a file.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 *
 * FIX: Always await Bun.write() to ensure the write completes before continuing.
 */
export async function saveData(path: string, data: string): Promise<void> {
  await Bun.write(path, data); // FIX: Added await!
}

/**
 * Saves data and returns the bytes written.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 * @returns The number of bytes written
 *
 * FIX: Await Bun.write() to get the actual byte count.
 * Bun.write() returns a Promise<number> with the bytes written.
 * This correctly handles unicode - bytes != string length for non-ASCII!
 */
export async function saveDataWithCount(path: string, data: string): Promise<number> {
  const bytesWritten = await Bun.write(path, data); // FIX: Await to get actual bytes!
  return bytesWritten;
}

/**
 * Saves data to a file and immediately reads it back for verification.
 *
 * @param path - The file path to write to
 * @param data - The data to write
 * @returns The data that was read back from the file
 */
export async function saveAndVerify(path: string, data: string): Promise<string> {
  await Bun.write(path, data); // FIX: Await before reading!

  // Now the file is guaranteed to be written before we read
  const file = Bun.file(path);
  const content = await file.text();

  return content;
}

/**
 * Saves multiple pieces of data to different files.
 *
 * @param entries - Array of [path, data] tuples
 *
 * FIX: Two options:
 * 1. Await each write sequentially (safer, slower)
 * 2. Use Promise.all for parallel writes (faster)
 */
export async function saveMultiple(entries: [string, string][]): Promise<void> {
  // Option 1: Sequential (shown here)
  // for (const [path, data] of entries) {
  //   await Bun.write(path, data);
  // }

  // Option 2: Parallel (better performance)
  await Promise.all(
    entries.map(([path, data]) => Bun.write(path, data))
  );
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

  await Bun.write(path, existing + data); // FIX: Await the write!
}
