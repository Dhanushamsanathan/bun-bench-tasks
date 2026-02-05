# Task 065: HTMLRewriter Element Attribute Bug

## Problem Description

The HTMLRewriter element handler doesn't properly modify element attributes. When attempting to add or update attributes, the changes are not applied to the output HTML.

## Bug Details

The implementation reads attributes correctly but fails to write them back:

```typescript
element(element) {
  const existingClass = element.getAttribute("class") || "";
  const newClass = existingClass ? `${existingClass} ${className}` : className;
  // BUG: Computes new value but never sets it
  const _unused = newClass;
  // Missing: element.setAttribute("class", newClass);
}
```

The code computes the correct new values but never calls `element.setAttribute()` to apply them. This causes:

1. **Silent failures**: No errors are thrown, but attributes are never modified
2. **Missing attributes**: New attributes never appear in the rewritten HTML
3. **Unchanged values**: Existing attribute updates are silently ignored

## Files

- `src/rewriter.ts` - Buggy implementation that doesn't call setAttribute()
- `test/rewriter.test.ts` - Test that verifies attribute modification (will fail)
- `solution/rewriter.ts` - Fixed implementation using `setAttribute()`

## Expected Behavior

HTMLRewriter element handlers should:
1. Successfully add new attributes to elements using `element.setAttribute()`
2. Update existing attribute values
3. Remove attributes using `element.removeAttribute()`
4. Output correctly modified HTML

## How to Run

```bash
# Run the failing test
bun test

# Test the rewriter module
bun run src/rewriter.ts
```
