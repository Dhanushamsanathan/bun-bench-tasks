# Task 076: Semver Range

## Problem Description

The semver range matching utility doesn't handle complex ranges correctly. It fails to properly parse and match versions against common range patterns like caret (`^`), tilde (`~`), and compound ranges.

## Bug

The current implementation uses a naive string-based approach to parse ranges, which fails for:
- Caret ranges (`^1.0.0`) - should allow minor and patch updates
- Tilde ranges (`~1.2.3`) - should allow only patch updates
- Compound ranges (`>=1.0.0 <2.0.0`) - should match versions in the intersection

## Expected Behavior

- `^1.0.0` should match `1.0.0`, `1.2.3`, `1.9.9` but not `2.0.0`
- `~1.2.3` should match `1.2.3`, `1.2.9` but not `1.3.0`
- `>=1.0.0 <2.0.0` should match `1.0.0`, `1.5.0` but not `2.0.0` or `0.9.0`
- `1.x` or `1.*` should match any `1.x.x` version

## API Reference

Uses `Bun.semver.satisfies()` for checking if a version matches a range.

## Files

- `src/semver-range.ts` - Buggy implementation
- `test/semver-range.test.ts` - Test cases (currently failing)
- `solution/semver-range.ts` - Corrected implementation
