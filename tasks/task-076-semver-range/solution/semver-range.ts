/**
 * Semver range matching utilities.
 *
 * Solution: Use Bun.semver.satisfies() which correctly handles all range types
 * including caret, tilde, compound ranges, and x-ranges.
 */

/**
 * Check if a version satisfies a semver range.
 *
 * Fix: Use Bun.semver.satisfies() directly instead of naive string parsing.
 */
export function satisfiesRange(version: string, range: string): boolean {
  // Fix: Use Bun.semver.satisfies() which correctly handles all range types
  return Bun.semver.satisfies(version, range);
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

  // Fix: Use Bun.semver.order() for proper semver comparison
  return matching.sort((a, b) => Bun.semver.order(a, b)).pop() || null;
}

/**
 * Find the lowest version that satisfies a range
 */
export function minSatisfying(versions: string[], range: string): string | null {
  const matching = filterByRange(versions, range);
  if (matching.length === 0) return null;

  // Fix: Use Bun.semver.order() for proper semver comparison
  return matching.sort((a, b) => Bun.semver.order(a, b))[0] || null;
}
