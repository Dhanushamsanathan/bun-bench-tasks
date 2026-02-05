/**
 * Command executor module
 *
 * This module provides utilities for running commands and checking their status.
 */

/**
 * Runs a command and returns whether it succeeded.
 *
 * @param cmd - Array of command and arguments
 * @returns True if command succeeded (exit code 0), false otherwise
 *
 * BUG: Never checks the exit code! Always returns true.
 */
export async function runCommandSafe(cmd: string[]): Promise<boolean> {
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // BUG: Never waits for process to complete or checks exit code!
  return true; // Always returns true, even if command failed!
}

/**
 * Runs a command and throws if it fails.
 *
 * @param cmd - Array of command and arguments
 * @throws Error if the command fails
 *
 * BUG: Never checks if command actually failed!
 */
export async function runCommandOrThrow(cmd: string[]): Promise<void> {
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // BUG: Should wait for process and check exit code!
  // This function never throws even when the command fails!
}

/**
 * Runs a command and returns the exit code.
 *
 * @param cmd - Array of command and arguments
 * @returns The exit code of the command
 *
 * BUG: Returns exitCode before process completes!
 */
export async function getExitCode(cmd: string[]): Promise<number> {
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // BUG: exitCode is null until process exits!
  return proc.exitCode!; // Will return null/undefined, not the actual code
}

/**
 * Runs a command with a timeout and returns success status.
 *
 * @param cmd - Array of command and arguments
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns True if command succeeded within timeout
 */
export async function runWithTimeout(cmd: string[], timeoutMs: number): Promise<boolean> {
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // BUG: Timeout doesn't actually work - we don't wait for process!
  return true;
}

/**
 * Runs multiple commands in sequence, stopping on first failure.
 *
 * @param commands - Array of command arrays
 * @returns True if all commands succeeded
 */
export async function runSequence(commands: string[][]): Promise<boolean> {
  for (const cmd of commands) {
    const proc = Bun.spawn(cmd, {
      stdout: "ignore",
      stderr: "ignore",
    });

    // BUG: Never checks if this command failed before running next!
    // Should stop on first failure, but continues regardless
  }

  return true; // BUG: Always returns true!
}

/**
 * Result of a command execution
 */
export interface CommandResult {
  success: boolean;
  exitCode: number;
  duration: number;
}

/**
 * Runs a command and returns detailed results.
 *
 * @param cmd - Array of command and arguments
 * @returns Detailed result including success, exit code, and duration
 */
export async function runCommandDetailed(cmd: string[]): Promise<CommandResult> {
  const startTime = Date.now();

  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // BUG: All these values are wrong because we don't wait for completion!
  return {
    success: true, // BUG: Always true
    exitCode: 0, // BUG: Hardcoded to 0
    duration: Date.now() - startTime, // BUG: Doesn't include actual execution time
  };
}
