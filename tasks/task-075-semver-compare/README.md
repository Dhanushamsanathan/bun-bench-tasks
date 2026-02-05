# Task 075: Semver Compare

## Problem Description

The semver comparison utility doesn't handle pre-release versions correctly. According to semver specification, pre-release versions have lower precedence than the associated normal version. For example, `1.0.0-alpha < 1.0.0`.

## Bug

The current implementation incorrectly compares versions by treating pre-release identifiers as simple string suffixes, which leads to incorrect ordering when comparing pre-release versions against their release counterparts.

## Expected Behavior

- `1.0.0-alpha` should be less than `1.0.0`
- `1.0.0-alpha` should be less than `1.0.0-beta`
- `1.0.0-alpha.1` should be less than `1.0.0-alpha.2`
- `2.0.0-rc.1` should be less than `2.0.0`

## API Reference

Uses `Bun.semver.order()` for comparing semantic versions.

## Files

- `src/semver-compare.ts` - Buggy implementation
- `test/semver-compare.test.ts` - Test cases (currently failing)
- `solution/semver-compare.ts` - Corrected implementation
