# Task 066: HTMLRewriter Text Content Encoding Bug

## Problem Description

The HTMLRewriter text content replacement loses encoding when handling special characters and multi-byte UTF-8 content. The text handler incorrectly processes text chunks.

## Bug Details

The implementation has two issues:

1. **Not handling text chunks properly**: Text content may arrive in multiple chunks, but the handler replaces on each chunk separately:

```typescript
text(text) {
  // BUG: Each chunk is replaced separately, breaking multi-chunk text
  text.replace(text.text.replace(oldText, newText));
}
```

2. **Encoding issues with special characters**: HTML entities and special characters are not properly preserved or escaped.

The correct approach accumulates all text chunks before replacement:

```typescript
text(text) {
  buffer += text.text;
  if (text.lastInTextNode) {
    text.replace(buffer.replace(oldText, newText), { html: false });
    buffer = "";
  } else {
    text.remove();
  }
}
```

## Files

- `src/textrewriter.ts` - Buggy implementation with encoding issues
- `test/textrewriter.test.ts` - Test that verifies text replacement (will fail)
- `solution/textrewriter.ts` - Fixed implementation with proper text handling

## Expected Behavior

HTMLRewriter text handlers should:
1. Properly accumulate text across chunks
2. Preserve UTF-8 encoding for multi-byte characters
3. Handle HTML entities correctly
4. Support both plain text and HTML replacement modes

## How to Run

```bash
# Run the failing test
bun test

# Test the text rewriter module
bun run src/textrewriter.ts
```
