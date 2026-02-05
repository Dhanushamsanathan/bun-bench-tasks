/**
 * Shell command executor
 * FIXED: Proper error handling with .nothrow()
 */

export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
}

/**
 * Checks if a file exists using shell test command
 * FIXED: Uses .nothrow() to handle exit code 1 gracefully
 */
export async function fileExists(filepath: string): Promise<boolean> {
  // FIXED: .nothrow() prevents throwing on non-zero exit code
  const result = await Bun.$`test -f ${filepath}`.nothrow();
  return result.exitCode === 0;
}

/**
 * Checks if a directory exists
 * FIXED: Uses .nothrow()
 */
export async function directoryExists(dirpath: string): Promise<boolean> {
  // FIXED: Added .nothrow()
  const result = await Bun.$`test -d ${dirpath}`.nothrow();
  return result.exitCode === 0;
}

/**
 * Runs a command and returns the result
 * FIXED: Handles command failures properly
 */
export async function runCommand(command: string): Promise<CommandResult> {
  // FIXED: .nothrow() allows capturing error info instead of throwing
  const result = await Bun.$`${{ raw: command }}`.nothrow();

  return {
    success: result.exitCode === 0,
    output: result.stdout.toString(),
    error: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

/**
 * Finds files matching a pattern
 * FIXED: Handles find failures gracefully
 */
export async function findFiles(directory: string, pattern: string): Promise<string[]> {
  // FIXED: .nothrow() handles no matches and errors gracefully
  const result = await Bun.$`find ${directory} -name ${pattern} 2>/dev/null`.nothrow();

  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Gets the exit code of a command
 * FIXED: Can now get any exit code
 */
export async function getExitCode(command: string): Promise<number> {
  // FIXED: .nothrow() allows getting any exit code
  const result = await Bun.$`${{ raw: command }}`.nothrow();
  return result.exitCode;
}

/**
 * Checks if a command exists in PATH
 * FIXED: Handles missing commands gracefully
 */
export async function commandExists(cmd: string): Promise<boolean> {
  // FIXED: .nothrow() returns false instead of throwing for missing commands
  const result = await Bun.$`which ${cmd}`.nothrow();
  return result.exitCode === 0;
}

/**
 * Runs a command with timeout
 * FIXED: Handles timeout gracefully
 */
export async function runWithTimeout(
  command: string,
  timeoutSeconds: number
): Promise<CommandResult> {
  // FIXED: .nothrow() handles timeout exit code (124) gracefully
  const result = await Bun.$`timeout ${timeoutSeconds} ${{ raw: command }}`.nothrow();

  return {
    success: result.exitCode === 0,
    output: result.stdout.toString(),
    error: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

/**
 * Tries to grep a pattern in a file
 * FIXED: Handles no matches gracefully
 */
export async function grepFile(
  filepath: string,
  pattern: string
): Promise<{ found: boolean; matches: string[] }> {
  // FIXED: .nothrow() handles no matches (exit 1) and errors gracefully
  const result = await Bun.$`grep ${pattern} ${filepath}`.nothrow();

  return {
    found: result.exitCode === 0,
    matches: result.exitCode === 0
      ? result.stdout.toString().trim().split('\n').filter(Boolean)
      : [],
  };
}

/**
 * Compares two files
 * FIXED: Handles different files gracefully
 */
export async function compareFiles(
  file1: string,
  file2: string
): Promise<{ identical: boolean; diff: string }> {
  // FIXED: .nothrow() handles different files (exit 1) and errors
  const result = await Bun.$`diff ${file1} ${file2}`.nothrow();

  return {
    identical: result.exitCode === 0,
    diff: result.stdout.toString(),
  };
}

/**
 * Validates JSON file
 * FIXED: Handles invalid JSON gracefully
 */
export async function validateJson(filepath: string): Promise<{
  valid: boolean;
  error: string;
}> {
  // FIXED: .nothrow() handles invalid JSON (non-zero exit) gracefully
  const result = await Bun.$`jq . ${filepath}`.nothrow();

  return {
    valid: result.exitCode === 0,
    error: result.stderr.toString(),
  };
}

/**
 * Alternative approach using quiet mode for boolean checks
 */
export async function fileExistsQuiet(filepath: string): Promise<boolean> {
  // Using .quiet() to suppress output and .nothrow() for error handling
  const result = await Bun.$`test -f ${filepath}`.quiet().nothrow();
  return result.exitCode === 0;
}

/**
 * Alternative: Run command with full error capture
 */
export async function runCommandSafe(command: string): Promise<CommandResult> {
  try {
    const result = await Bun.$`${{ raw: command }}`.nothrow();
    return {
      success: result.exitCode === 0,
      output: result.stdout.toString(),
      error: result.stderr.toString(),
      exitCode: result.exitCode,
    };
  } catch (error) {
    // Handle unexpected errors (e.g., shell not available)
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error),
      exitCode: -1,
    };
  }
}
