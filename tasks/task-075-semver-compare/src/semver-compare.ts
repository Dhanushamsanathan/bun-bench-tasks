/**
 * Compare two semantic versions and return their ordering.
 *
 * Bug: This implementation doesn't properly handle pre-release versions.
 * It incorrectly treats pre-release versions as greater than or equal to
 * their release counterparts.
 */

/**
 * Compare two semver versions.
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  // Bug: Incorrectly strips pre-release info before comparison
  // This causes 1.0.0-alpha to be considered equal to 1.0.0
  const normalizeVersion = (v: string): string => {
    // Incorrectly remove pre-release suffix for comparison
    return v.split("-")[0];
  };

  const normalized1 = normalizeVersion(v1);
  const normalized2 = normalizeVersion(v2);

  return Bun.semver.order(normalized1, normalized2);
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
