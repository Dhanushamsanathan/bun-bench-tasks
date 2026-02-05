/**
 * Shell command executor
 * BUG: Missing .nothrow() causes uncaught exceptions on command failures
 */

export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
}

/**
 * Checks if a file exists using shell test command
 * BUG: Throws exception when file doesn't exist (exit code 1)
 */
export async function fileExists(filepath: string): Promise<boolean> {
  // BUG: test -f returns exit code 1 if file doesn't exist
  // Without .nothrow(), this throws instead of returning false
  const result = await Bun.$`test -f ${filepath}`;
  return result.exitCode === 0;
}

/**
 * Checks if a directory exists
 * BUG: Same issue - throws when directory doesn't exist
 */
export async function directoryExists(dirpath: string): Promise<boolean> {
  // BUG: Missing .nothrow()
  const result = await Bun.$`test -d ${dirpath}`;
  return result.exitCode === 0;
}

/**
 * Runs a command and returns the result
 * BUG: Doesn't handle command failures properly
 */
export async function runCommand(command: string): Promise<CommandResult> {
  // BUG: If command fails, this throws instead of returning error info
  const result = await Bun.$`${{ raw: command }}`;

  return {
    success: result.exitCode === 0,
    output: result.stdout.toString(),
    error: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

/**
 * Finds files matching a pattern
 * BUG: find returns non-zero when no matches, causing throw
 */
export async function findFiles(directory: string, pattern: string): Promise<string[]> {
  // BUG: find may fail or return non-zero, causing exception
  const result = await Bun.$`find ${directory} -name ${pattern}`;
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Gets the exit code of a command
 * BUG: Can't get exit code if command throws
 */
export async function getExitCode(command: string): Promise<number> {
  // BUG: Throws on non-zero exit, making it impossible to get the exit code
  const result = await Bun.$`${{ raw: command }}`;
  return result.exitCode;
}

/**
 * Checks if a command exists in PATH
 * BUG: which returns non-zero for missing commands
 */
export async function commandExists(cmd: string): Promise<boolean> {
  // BUG: which returns exit code 1 if command not found
  const result = await Bun.$`which ${cmd}`;
  return result.exitCode === 0;
}

/**
 * Runs a command with timeout
 * BUG: Timeout commands fail without proper handling
 */
export async function runWithTimeout(
  command: string,
  timeoutSeconds: number
): Promise<CommandResult> {
  // BUG: timeout command exits with 124 on timeout, causing throw
  const result = await Bun.$`timeout ${timeoutSeconds} ${{ raw: command }}`;

  return {
    success: result.exitCode === 0,
    output: result.stdout.toString(),
    error: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

/**
 * Tries to grep a pattern in a file
 * BUG: grep exits with 1 when no match found
 */
export async function grepFile(
  filepath: string,
  pattern: string
): Promise<{ found: boolean; matches: string[] }> {
  // BUG: grep returns exit code 1 when no matches, causing throw
  const result = await Bun.$`grep ${pattern} ${filepath}`;

  return {
    found: result.exitCode === 0,
    matches: result.stdout.toString().trim().split('\n').filter(Boolean),
  };
}

/**
 * Compares two files
 * BUG: diff returns non-zero when files differ
 */
export async function compareFiles(
  file1: string,
  file2: string
): Promise<{ identical: boolean; diff: string }> {
  // BUG: diff returns exit code 1 when files differ, causing throw
  const result = await Bun.$`diff ${file1} ${file2}`;

  return {
    identical: result.exitCode === 0,
    diff: result.stdout.toString(),
  };
}

/**
 * Validates JSON file
 * BUG: jq returns non-zero on invalid JSON
 */
export async function validateJson(filepath: string): Promise<{
  valid: boolean;
  error: string;
}> {
  // BUG: jq returns non-zero for invalid JSON, causing throw
  const result = await Bun.$`jq . ${filepath}`;

  return {
    valid: result.exitCode === 0,
    error: result.stderr.toString(),
  };
}
