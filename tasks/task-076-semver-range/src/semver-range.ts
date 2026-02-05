/**
 * Semver range matching utilities.
 *
 * Bug: This implementation uses naive string parsing that doesn't correctly
 * handle caret, tilde, or compound ranges.
 */

/**
 * Check if a version satisfies a semver range.
 *
 * Bug: This implementation incorrectly parses ranges:
 * - For caret (^), it only checks the major version
 * - For tilde (~), it treats it the same as caret
 * - For compound ranges, it only checks the first condition
 */
export function satisfiesRange(version: string, range: string): boolean {
  // Bug: Naive implementation that doesn't use Bun.semver.satisfies()

  // Strip any leading 'v' from version
  const cleanVersion = version.replace(/^v/, "");
  const [major, minor, patch] = cleanVersion.split(".").map((n) => parseInt(n, 10) || 0);

  // Bug: Incorrectly handle caret ranges - only checks major version
  if (range.startsWith("^")) {
    const rangeVersion = range.slice(1);
    const [rangeMajor] = rangeVersion.split(".").map((n) => parseInt(n, 10) || 0);
    // Bug: Only checks if major versions match, ignores that version must be >= range
    return major === rangeMajor;
  }

  // Bug: Tilde ranges are treated the same as caret (wrong!)
  if (range.startsWith("~")) {
    const rangeVersion = range.slice(1);
    const [rangeMajor] = rangeVersion.split(".").map((n) => parseInt(n, 10) || 0);
    return major === rangeMajor;
  }

  // Bug: For compound ranges, only check the first part
  if (range.includes(" ")) {
    const firstPart = range.split(" ")[0];
    return satisfiesRange(version, firstPart);
  }

  // Bug: For >= ranges, incorrectly compare as strings
  if (range.startsWith(">=")) {
    const rangeVersion = range.slice(2);
    return cleanVersion >= rangeVersion; // String comparison is wrong!
  }

  // Bug: For > ranges
  if (range.startsWith(">") && !range.startsWith(">=")) {
    const rangeVersion = range.slice(1);
    return cleanVersion > rangeVersion; // String comparison is wrong!
  }

  // Bug: For <= ranges
  if (range.startsWith("<=")) {
    const rangeVersion = range.slice(2);
    return cleanVersion <= rangeVersion;
  }

  // Bug: For < ranges
  if (range.startsWith("<") && !range.startsWith("<=")) {
    const rangeVersion = range.slice(1);
    return cleanVersion < rangeVersion;
  }

  // Bug: For x-ranges, always return true
  if (range.includes("x") || range.includes("*")) {
    return true;
  }

  // Exact match
  return cleanVersion === range;
}

/**
 * Find all versions that satisfy a range
 */
export function filterByRange(versions: string[], range: string): string[] {
  return versions.filter((v) => satisfiesRange(v, range));
}

/**
 * Find the highest version that satisfies a range
 */
export function maxSatisfying(versions: string[], range: string): string | null {
  const matching = filterByRange(versions, range);
  if (matching.length === 0) return null;

  // Bug: Uses string comparison instead of semver comparison
  return matching.sort().pop() || null;
}

/**
 * Find the lowest version that satisfies a range
 */
export function minSatisfying(versions: string[], range: string): string | null {
  const matching = filterByRange(versions, range);
  if (matching.length === 0) return null;

  // Bug: Uses string comparison instead of semver comparison
  return matching.sort()[0] || null;
}
