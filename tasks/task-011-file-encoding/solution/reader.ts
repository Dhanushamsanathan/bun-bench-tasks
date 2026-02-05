/**
 * Configuration file reader - FIXED VERSION
 *
 * This module provides utilities for reading configuration files.
 */

/**
 * Reads a configuration file and returns its contents as a string.
 *
 * @param path - The path to the configuration file
 * @returns The file contents as a string
 *
 * FIX: Use .text() instead of .arrayBuffer() to get string content directly.
 * Bun.file() returns a BunFile object with multiple reading methods:
 * - .text() - returns string (UTF-8 decoded)
 * - .json() - returns parsed JSON
 * - .arrayBuffer() - returns ArrayBuffer (raw bytes)
 * - .bytes() - returns Uint8Array
 * - .stream() - returns ReadableStream
 */
export async function readConfig(path: string): Promise<string> {
  const file = Bun.file(path);
  const content = await file.text(); // FIX: Use .text() to get string directly
  return content;
}

/**
 * Reads a configuration file and parses a specific key.
 *
 * @param path - The path to the configuration file
 * @param key - The key to extract (format: KEY=value)
 * @returns The value associated with the key, or undefined
 */
export async function readConfigKey(path: string, key: string): Promise<string | undefined> {
  const content = await readConfig(path);

  // Now this works correctly because content is a proper string
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith(`${key}=`)) {
      return line.slice(key.length + 1);
    }
  }

  return undefined;
}

/**
 * Reads multiple configuration files and merges their contents.
 *
 * @param paths - Array of file paths to read
 * @returns Combined contents of all files
 */
export async function readMultipleConfigs(paths: string[]): Promise<string[]> {
  // Bonus improvement: Use Promise.all for parallel reading
  const results = await Promise.all(
    paths.map(path => readConfig(path))
  );

  return results;
}
