/**
 * Glob directory scanning utilities
 * BUG: Incorrect handling of symlinks and hidden files
 */

export interface ScanOptions {
  cwd?: string;
  includeHidden?: boolean;
  followSymlinks?: boolean;
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
  absolute?: boolean;
}

/**
 * Scan directory for files matching a pattern (sync)
 * BUG: Options are not properly passed to scanSync
 */
export function scanDirectorySync(pattern: string, options: ScanOptions = {}): string[] {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Not passing options to scanSync - ignores all configuration
  // Should pass options object with dot, followSymlinks, etc.
  for (const file of glob.scanSync()) {
    results.push(file);
  }

  return results;
}

/**
 * Scan directory for files matching a pattern (async)
 * BUG: Async iteration is broken and options are ignored
 */
export async function scanDirectoryAsync(pattern: string, options: ScanOptions = {}): Promise<string[]> {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Not awaiting properly and not passing options
  // The scan() returns an async iterator that needs proper handling
  const scanner = glob.scan();

  // BUG: Trying to use sync iteration on async iterator
  // This won't work correctly
  for (const file of scanner as any) {
    results.push(file);
  }

  return results;
}

/**
 * Find all hidden files in a directory
 * BUG: Not enabling dot file matching
 */
export function findHiddenFiles(cwd: string): string[] {
  // BUG: Pattern for hidden files is correct, but dot option is not enabled
  // Hidden files start with a dot
  const glob = new Bun.Glob("**/.*");
  const results: string[] = [];

  // BUG: Not passing { dot: true } to enable matching dotfiles
  // Also not passing cwd
  for (const file of glob.scanSync()) {
    results.push(file);
  }

  return results;
}

/**
 * Find files following symlinks
 * BUG: Symlink following is not enabled
 */
export function findFilesWithSymlinks(pattern: string, cwd: string): string[] {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Not passing followSymlinks option
  // Symlinked directories/files won't be traversed
  for (const file of glob.scanSync({ cwd })) {
    results.push(file);
  }

  return results;
}

/**
 * Get absolute paths for matched files
 * BUG: Not returning absolute paths
 */
export function getAbsolutePaths(pattern: string, cwd: string): string[] {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Not passing absolute: true option
  // Returns relative paths instead of absolute
  for (const file of glob.scanSync({ cwd })) {
    results.push(file);
  }

  return results;
}

/**
 * Find only directories matching pattern
 * BUG: Returns files instead of only directories
 */
export function findDirectories(pattern: string, cwd: string): string[] {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Not passing onlyFiles: false to get directories
  // By default, scan only returns files
  for (const file of glob.scanSync({ cwd })) {
    results.push(file);
  }

  return results;
}

/**
 * Comprehensive scan with all options
 * BUG: Options mapping is incorrect
 */
export function comprehensiveScan(pattern: string, options: ScanOptions): string[] {
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];

  // BUG: Option names are mapped incorrectly
  // includeHidden should map to 'dot', not passed directly
  const scanOptions = {
    cwd: options.cwd,
    hidden: options.includeHidden,      // BUG: Should be 'dot' not 'hidden'
    symlinks: options.followSymlinks,   // BUG: Should be 'followSymlinks'
    files: options.onlyFiles,           // BUG: Should be 'onlyFiles'
    dirs: options.onlyDirectories,      // BUG: Wrong option name
    abs: options.absolute               // BUG: Should be 'absolute'
  };

  for (const file of glob.scanSync(scanOptions as any)) {
    results.push(file);
  }

  return results;
}

/**
 * Count files matching pattern
 * BUG: Returns 0 due to async iteration issue
 */
export async function countMatchingFiles(pattern: string, cwd: string): Promise<number> {
  const glob = new Bun.Glob(pattern);
  let count = 0;

  // BUG: Not using for-await-of for async iteration
  for (const _ of glob.scan({ cwd }) as any) {
    count++;
  }

  return count;
}
