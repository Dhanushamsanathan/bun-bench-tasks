/**
 * Command executor module - FIXED VERSION
 *
 * This module provides utilities for running commands and checking their status.
 */

/**
 * Runs a command and returns whether it succeeded.
 *
 * @param cmd - Array of command and arguments
 * @returns True if command succeeded (exit code 0), false otherwise
 *
 * FIX: Wait for process to exit and check the exit code.
 */
export async function runCommandSafe(cmd: string[]): Promise<boolean> {
  try {
    const proc = Bun.spawn(cmd, {
      stdout: "ignore",
      stderr: "ignore",
    });

    // FIX: Wait for process to complete
    await proc.exited;

    // FIX: Check exit code - 0 means success
    return proc.exitCode === 0;
  } catch {
    // Handle spawn failures (e.g., command not found)
    return false;
  }
}

/**
 * Runs a command and throws if it fails.
 *
 * @param cmd - Array of command and arguments
 * @throws Error if the command fails
 *
 * FIX: Wait for process and throw on non-zero exit code.
 */
export async function runCommandOrThrow(cmd: string[]): Promise<void> {
  const proc = Bun.spawn(cmd, {
    stdout: "ignore",
    stderr: "ignore",
  });

  // FIX: Wait for process to complete
  await proc.exited;

  // FIX: Throw if exit code is non-zero
  if (proc.exitCode !== 0) {
    throw new Error(`Command failed with exit code ${proc.exitCode}: ${cmd.join(" ")}`);
  }
}

/**
 * Runs a command and returns the exit code.
 *
 * @param cmd - Array of command and arguments
 * @returns The exit code of the command
 *
 * FIX: Wait for process to complete before accessing exitCode.
 */
export async function getExitCode(cmd: string[]): Promise<number> {
  try {
    const proc = Bun.spawn(cmd, {
      stdout: "ignore",
      stderr: "ignore",
    });

    // FIX: Wait for process to complete
    await proc.exited;

    // FIX: Now exitCode is valid
    return proc.exitCode ?? -1;
  } catch {
    // Return -1 for spawn failures
    return -1;
  }
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

  // FIX: Race between process completion and timeout
  const timeoutPromise = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), timeoutMs));

  const result = await Promise.race([proc.exited.then(() => "done" as const), timeoutPromise]);

  if (result === "timeout") {
    // Kill the process if it's still running
    proc.kill();
    return false;
  }

  // FIX: Check exit code
  return proc.exitCode === 0;
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

    // FIX: Wait for each command to complete
    await proc.exited;

    // FIX: Stop on first failure
    if (proc.exitCode !== 0) {
      return false;
    }
  }

  return true;
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

  try {
    const proc = Bun.spawn(cmd, {
      stdout: "ignore",
      stderr: "ignore",
    });

    // FIX: Wait for process to complete
    await proc.exited;

    // FIX: Calculate actual duration and return real values
    return {
      success: proc.exitCode === 0,
      exitCode: proc.exitCode ?? -1,
      duration: Date.now() - startTime,
    };
  } catch {
    return {
      success: false,
      exitCode: -1,
      duration: Date.now() - startTime,
    };
  }
}
