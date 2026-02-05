/**
 * Glob pattern matching utilities
 * BUG: Incorrect glob pattern syntax causes matching failures
 */

/**
 * Check if a file path matches a TypeScript file pattern
 * BUG: Using wrong pattern - missing the recursive wildcard properly
 */
export function isTypeScriptFile(filePath: string): boolean {
  // BUG: Pattern should be "**/*.ts" but using "*.ts" which only matches root level
  const glob = new Bun.Glob("*.ts");
  return glob.match(filePath);
}

/**
 * Check if a file matches one of the given extensions
 * BUG: Brace expansion pattern is malformed
 */
export function matchesExtension(filePath: string, extensions: string[]): boolean {
  // BUG: Incorrectly building the pattern - adding extra dots and missing proper format
  const pattern = `*.${extensions.join(".")}`;  // Results in "*.ts.js" instead of "*.{ts,js}"
  const glob = new Bun.Glob(pattern);
  return glob.match(filePath);
}

/**
 * Match files against multiple patterns (any match returns true)
 * BUG: Pattern construction is incorrect for brace expansion
 */
export function matchAnyPattern(filePath: string, patterns: string[]): boolean {
  // BUG: Trying to combine patterns incorrectly
  // Should check each pattern individually, not concatenate them
  const combinedPattern = patterns.join("|");  // "|" is not valid glob syntax
  const glob = new Bun.Glob(combinedPattern);
  return glob.match(filePath);
}

/**
 * Check if file is in a specific directory pattern
 * BUG: Directory matching pattern is wrong
 */
export function isInDirectory(filePath: string, dirPattern: string): boolean {
  // BUG: Not properly appending the recursive wildcard
  // Should be `${dirPattern}/**/*` but missing the final wildcard
  const glob = new Bun.Glob(`${dirPattern}/**`);
  return glob.match(filePath);
}

/**
 * Match source files (ts, tsx, js, jsx)
 * BUG: Brace expansion syntax is incorrect
 */
export function isSourceFile(filePath: string): boolean {
  // BUG: Using parentheses instead of braces, and missing proper syntax
  // Correct pattern: "**/*.{ts,tsx,js,jsx}"
  const glob = new Bun.Glob("**/*.(ts|tsx|js|jsx)");
  return glob.match(filePath);
}

/**
 * Match config files by name pattern
 * BUG: Character class and brace expansion mixed incorrectly
 */
export function isConfigFile(filePath: string): boolean {
  // BUG: Incorrect pattern - mixing regex syntax with glob
  // Correct pattern: "**/{*.config.*,*.rc,*.json}"
  const glob = new Bun.Glob("**/[config|rc].*");
  return glob.match(filePath);
}

/**
 * Get all matching files from a list
 * Returns files that match the given pattern
 */
export function filterByPattern(files: string[], pattern: string): string[] {
  const glob = new Bun.Glob(pattern);
  return files.filter(file => glob.match(file));
}

/**
 * Check if path should be excluded based on common ignore patterns
 * BUG: Negation pattern handling is wrong
 */
export function shouldExclude(filePath: string): boolean {
  const excludePatterns = [
    // BUG: Glob doesn't support "!" negation prefix in the pattern itself
    // These patterns are malformed
    "!node_modules/**",
    "!dist/**",
    "!.git/**"
  ];

  // BUG: This logic is inverted and patterns are wrong
  for (const pattern of excludePatterns) {
    const glob = new Bun.Glob(pattern);
    if (glob.match(filePath)) {
      return true;
    }
  }
  return false;
}
