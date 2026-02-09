/**
 * Shell command runner with file reading capabilities
 * BUG: Command injection vulnerability through unsafe string handling
 */

/**
 * Reads the contents of a file using shell cat command
 * BUG: Uses string concatenation instead of template interpolation,
 * allowing command injection through specially crafted filenames
 */
export async function runUserCommand(filename: string): Promise<string> {
  // BUG: Using raw string concatenation bypasses Bun's escaping!
  // This allows command injection via filenames like "file.txt; rm -rf /"
  const command = "cat " + filename;
  const result = await Bun.$`${{ raw: command }}`.text();
  return result;
}

/**
 * Searches for a pattern in a file
 * BUG: Same vulnerability - pattern could contain shell metacharacters
 */
export async function searchInFile(filename: string, pattern: string): Promise<string> {
  // BUG: Concatenating untrusted input into shell command
  const command = `grep "${pattern}" ${filename}`;
  const result = await Bun.$`${{ raw: command }}`.nothrow().text();
  return result;
}

/**
 * Gets file information
 * BUG: Multiple injection points
 */
export async function getFileInfo(filename: string): Promise<{
  size: string;
  lines: string;
  words: string;
}> {
  // BUG: Each of these has injection vulnerability
  const sizeCmd = `wc -c < ${filename}`;
  const linesCmd = `wc -l < ${filename}`;
  const wordsCmd = `wc -w < ${filename}`;

  const [size, lines, words] = await Promise.all([
    Bun.$`${{ raw: sizeCmd }}`.nothrow().text(),
    Bun.$`${{ raw: linesCmd }}`.nothrow().text(),
    Bun.$`${{ raw: wordsCmd }}`.nothrow().text(),
  ]);

  return {
    size: size.trim(),
    lines: lines.trim(),
    words: words.trim(),
  };
}

/**
 * Copies a file to a new location
 * BUG: Both source and destination are vulnerable
 */
export async function copyFile(source: string, destination: string): Promise<boolean> {
  // BUG: Command injection through either parameter
  const command = `cp ${source} ${destination}`;
  const result = await Bun.$`${{ raw: command }}`.nothrow();
  return result.exitCode === 0;
}

/**
 * Lists files matching a pattern
 * BUG: Glob pattern could contain malicious characters
 */
export async function listFiles(pattern: string): Promise<string[]> {
  // BUG: Pattern could be "; malicious_command #"
  const command = `ls ${pattern}`;
  const result = await Bun.$`${{ raw: command }}`.nothrow().text();
  return result.trim().split('\n').filter(Boolean);
}
