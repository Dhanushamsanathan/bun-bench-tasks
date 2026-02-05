/**
 * Command runner module - FIXED VERSION
 *
 * This module provides utilities for running shell commands and capturing output.
 */

/**
 * Runs a command and returns its stdout output.
 *
 * @param cmd - Array of command and arguments (e.g., ["echo", "hello"])
 * @returns The stdout output as a string
 *
 * FIX: Read the stdout stream using Bun.readableStreamToText()
 */
export async function runCommand(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd);

  // FIX: Read the stdout stream!
  // Option 1: Using Bun.readableStreamToText (cleaner)
  const output = await Bun.readableStreamToText(proc.stdout);

  // Option 2: Using Response (also works)
  // const output = await new Response(proc.stdout).text();

  return output;
}

/**
 * Runs a command and returns both stdout and stderr.
 *
 * @param cmd - Array of command and arguments
 * @returns Object with stdout and stderr strings
 *
 * FIX: Read both streams properly.
 */
export async function runCommandWithStderr(cmd: string[]): Promise<{ stdout: string; stderr: string }> {
  const proc = Bun.spawn(cmd, {
    stderr: "pipe",
  });

  // FIX: Read both streams in parallel
  const [stdout, stderr] = await Promise.all([
    Bun.readableStreamToText(proc.stdout),
    Bun.readableStreamToText(proc.stderr!),
  ]);

  return { stdout, stderr };
}

/**
 * Runs a command and returns output line by line.
 *
 * @param cmd - Array of command and arguments
 * @returns Array of output lines
 */
export async function runCommandLines(cmd: string[]): Promise<string[]> {
  const proc = Bun.spawn(cmd);

  // FIX: First read the stream to get a string, then split
  const output = await Bun.readableStreamToText(proc.stdout);

  // Split by newlines and filter out empty strings at the end
  return output.split("\n").filter((line, i, arr) => {
    // Keep all lines except trailing empty line
    return i < arr.length - 1 || line.length > 0;
  });
}

/**
 * Runs a command and checks if it produced any output.
 *
 * @param cmd - Array of command and arguments
 * @returns True if the command produced non-empty output
 */
export async function hasOutput(cmd: string[]): Promise<boolean> {
  const proc = Bun.spawn(cmd);

  // FIX: Actually read the output and check its length
  const output = await Bun.readableStreamToText(proc.stdout);

  return output.trim().length > 0;
}

/**
 * Runs multiple commands and collects their outputs.
 *
 * @param commands - Array of command arrays
 * @returns Array of outputs
 */
export async function runMultipleCommands(commands: string[][]): Promise<string[]> {
  // FIX: runCommand now properly captures output
  // Bonus: Run in parallel for better performance
  const results = await Promise.all(commands.map((cmd) => runCommand(cmd)));

  return results;
}
