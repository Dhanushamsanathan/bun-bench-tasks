/**
 * Compare two semantic versions and return their ordering.
 *
 * Solution: Use Bun.semver.order() directly without stripping pre-release info.
 * Bun.semver correctly handles pre-release version comparison according to
 * the semver specification.
 */

/**
 * Compare two semver versions.
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  // Fix: Use Bun.semver.order() directly - it handles pre-release versions correctly
  return Bun.semver.order(v1, v2);
}

/**
 * Check if v1 is less than v2
 */
export function isLessThan(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === -1;
}

/**
 * Check if v1 is greater than v2
 */
export function isGreaterThan(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === 1;
}

/**
 * Check if v1 equals v2
 */
export function isEqual(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === 0;
}

/**
 * Sort an array of versions in ascending order
 */
export function sortVersions(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersions(a, b));
}
