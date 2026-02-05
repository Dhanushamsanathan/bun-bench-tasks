# Task 067: HTMLRewriter Link Extraction Bug

## Problem Description

The HTMLRewriter link extraction function misses some link types. It only extracts `href` attributes from `<a>` tags, ignoring other resource links like images, scripts, stylesheets, and embedded content.

## Bug Details

The implementation only handles anchor tags:

```typescript
new HTMLRewriter().on("a", {
  element(element) {
    const href = element.getAttribute("href");
    if (href) links.push(href);
  }
});
```

This misses:
- `<img src="...">` - images
- `<script src="...">` - scripts
- `<link href="...">` - stylesheets, icons
- `<video src="...">` and `<source src="...">` - media
- `<iframe src="...">` - embedded content
- `<form action="...">` - form destinations
- `srcset` attributes for responsive images

## Files

- `src/linkextractor.ts` - Buggy implementation missing link types
- `test/linkextractor.test.ts` - Test that verifies all links are extracted (will fail)
- `solution/linkextractor.ts` - Fixed implementation extracting all link types

## Expected Behavior

Link extraction should:
1. Find all `href` attributes (a, link, area, base)
2. Find all `src` attributes (img, script, video, audio, iframe, source, embed)
3. Find all `srcset` values (img, source)
4. Find `action` attributes (form)
5. Find `data` attributes (object)
6. Categorize links by type
7. Handle relative and absolute URLs

## How to Run

```bash
# Run the failing test
bun test

# Test the link extractor module
bun run src/linkextractor.ts
```
