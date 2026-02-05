/**
 * Command runner module
 *
 * This module provides utilities for running shell commands and capturing output.
 */

/**
 * Runs a command and returns its stdout output.
 *
 * @param cmd - Array of command and arguments (e.g., ["echo", "hello"])
 * @returns The stdout output as a string
 *
 * BUG: The stdout is never read! We just return an empty string.
 */
export async function runCommand(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd);
  return ""; // BUG: Never reads stdout!
}

/**
 * Runs a command and returns both stdout and stderr.
 *
 * @param cmd - Array of command and arguments
 * @returns Object with stdout and stderr strings
 *
 * BUG: Neither stdout nor stderr are read.
 */
export async function runCommandWithStderr(cmd: string[]): Promise<{ stdout: string; stderr: string }> {
  const proc = Bun.spawn(cmd, {
    stderr: "pipe",
  });

  // BUG: We have the streams but never read them!
  return {
    stdout: "", // BUG: Should read proc.stdout
    stderr: "", // BUG: Should read proc.stderr
  };
}

/**
 * Runs a command and returns output line by line.
 *
 * @param cmd - Array of command and arguments
 * @returns Array of output lines
 */
export async function runCommandLines(cmd: string[]): Promise<string[]> {
  const proc = Bun.spawn(cmd);

  // BUG: Trying to access stdout as if it were already a string
  const output = proc.stdout; // This is a ReadableStream, not a string!

  // BUG: This won't work - stdout is not a string
  return (output as unknown as string).split("\n");
}

/**
 * Runs a command and checks if it produced any output.
 *
 * @param cmd - Array of command and arguments
 * @returns True if the command produced output
 */
export async function hasOutput(cmd: string[]): Promise<boolean> {
  const proc = Bun.spawn(cmd);

  // BUG: Checking if stdout exists is not the same as checking if there's output
  return proc.stdout !== null; // This will always be true when stdout is piped!
}

/**
 * Runs multiple commands and collects their outputs.
 *
 * @param commands - Array of command arrays
 * @returns Array of outputs
 */
export async function runMultipleCommands(commands: string[][]): Promise<string[]> {
  const results: string[] = [];

  for (const cmd of commands) {
    const output = await runCommand(cmd);
    results.push(output);
  }

  return results; // BUG: All results will be empty strings!
}
