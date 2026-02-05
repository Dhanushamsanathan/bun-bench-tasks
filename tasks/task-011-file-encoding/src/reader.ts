/**
 * Configuration file reader
 *
 * This module provides utilities for reading configuration files.
 */

/**
 * Reads a configuration file and returns its contents as a string.
 *
 * @param path - The path to the configuration file
 * @returns The file contents as a string
 *
 * BUG: This implementation uses arrayBuffer() which returns an ArrayBuffer,
 * not a string. The type cast is incorrect and will not convert the binary
 * data to a proper string representation.
 */
export async function readConfig(path: string): Promise<string> {
  const file = Bun.file(path);
  const content = await file.arrayBuffer(); // BUG: Returns ArrayBuffer, not string
  return content as unknown as string; // Wrong type cast - doesn't actually convert!
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

  // BUG: This will fail because content is not a real string
  // String methods like split() won't work properly on an ArrayBuffer
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
  const results: string[] = [];

  for (const path of paths) {
    const content = await readConfig(path);
    results.push(content);
  }

  return results;
}
