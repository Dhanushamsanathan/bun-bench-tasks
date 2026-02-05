import { expect, test, describe } from "bun:test";
import {
  replaceText,
  transformTextContent,
  escapeHtmlEntities,
  preserveUtf8Text,
  wrapTextWithTag,
  countAndReplaceWords,
} from "../src/textrewriter";

describe("HTMLRewriter Text Content", () => {
  test("should replace text content", async () => {
    const html = "<p>Hello World</p>";
    const result = await replaceText(html, "p", "World", "Universe");

    expect(result).toContain("Hello Universe");
    expect(result).not.toContain("World");
  });

  test("should handle text replacement with special characters", async () => {
    const html = "<p>Price: $100</p>";
    const result = await replaceText(html, "p", "$100", "$200");

    expect(result).toContain("Price: $200");
  });

  test("should preserve UTF-8 multi-byte characters", async () => {
    const html = "<p>Japanese: ___</p>";
    const result = await replaceText(html, "p", "___", "\u3053\u3093\u306B\u3061\u306F");

    // This test verifies UTF-8 is preserved
    expect(result).toContain("\u3053\u3093\u306B\u3061\u306F");
  });

  test("should handle emoji correctly", async () => {
    const html = "<span>Hello [EMOJI]</span>";
    const result = await replaceText(html, "span", "[EMOJI]", "\uD83D\uDC4B");

    expect(result).toContain("Hello \uD83D\uDC4B");
  });

  test("should transform text to uppercase", async () => {
    const html = "<p>hello world</p>";
    const result = await transformTextContent(html, "p", (t) => t.toUpperCase());

    expect(result).toContain("HELLO WORLD");
  });

  test("should transform text with custom function", async () => {
    const html = "<p>hello</p>";
    const result = await transformTextContent(html, "p", (t) => `[${t}]`);

    // This test FAILS because chunks are wrapped separately
    // With chunked text, we might get "[hel][lo]" instead of "[hello]"
    expect(result).toContain("[hello]");
  });

  test("should escape HTML entities and output literal ampersands", async () => {
    const html = "<div>Content with ampersand: &amp; here</div>";
    const result = await escapeHtmlEntities(html, "div");

    // The text node receives "&" as decoded content
    // We escape it to "&amp;" and use html:false to output literally
    // This test FAILS with html:true because &amp; is interpreted as &
    // We want the OUTPUT to contain literal "&amp;" characters
    const containsLiteralAmp = result.includes("&amp;");
    expect(containsLiteralAmp).toBe(true);
    // The output should NOT have the & decoded back to just &
    // Count occurrences of "&amp;" - should have at least one escaped ampersand
    expect(result.match(/&amp;/g)?.length).toBeGreaterThanOrEqual(1);
  });

  test("should not reinterpret escaped entities as HTML", async () => {
    const html = "<div>Test &amp; verify</div>";
    const result = await escapeHtmlEntities(html, "div");

    // After escaping, & becomes &amp;
    // With html:false the output should show &amp;amp; (the escaped version)
    // With html:true (bug), &amp; gets re-interpreted as just &
    // This test checks the code path doesn't lose the escaping
    const sourceCode = await Bun.file(import.meta.dir + "/../src/textrewriter.ts").text();
    // Check that html: false is used (the fix)
    const usesHtmlFalse = sourceCode.includes('html: false') || sourceCode.includes('html:false');
    // This test FAILS because buggy code uses html: true
    expect(usesHtmlFalse).toBe(true);
  });

  test("should preserve UTF-8 when adding prefix", async () => {
    const html = "<span>\u65E5\u672C\u8A9E</span>";
    const result = await preserveUtf8Text(html, "span", "Language: ");

    // This test FAILS if chunks aren't accumulated properly
    // Prefix should appear once before the full text
    expect(result).toContain("Language: \u65E5\u672C\u8A9E");
    // Should NOT have prefix in the middle of text
    expect(result).not.toMatch(/Language:.*Language:/);
  });

  test("should wrap text with single tag", async () => {
    const html = "<p>Important text</p>";
    const result = await wrapTextWithTag(html, "p", "strong");

    // This test FAILS because each chunk gets wrapped separately
    // Should be one <strong> wrapper, not multiple
    expect(result).toContain("<strong>Important text</strong>");
    // Should not have multiple strong tags
    const strongCount = (result.match(/<strong>/g) || []).length;
    expect(strongCount).toBe(1);
  });

  test("should count words correctly", async () => {
    const html = "<p>The quick brown fox jumps over the lazy dog</p>";
    const { wordCount } = await countAndReplaceWords(html, "p");

    // This test FAILS because word counting per-chunk breaks on chunk boundaries
    expect(wordCount).toBe(9);
  });

  test("should count words with multiple spaces", async () => {
    const html = "<p>Word1   Word2    Word3</p>";
    const { wordCount } = await countAndReplaceWords(html, "p");

    // Multiple spaces between words should still count correctly
    expect(wordCount).toBe(3);
  });

  test("should handle empty text nodes", async () => {
    const html = "<p></p>";
    const result = await replaceText(html, "p", "test", "replaced");

    expect(result).toBe("<p></p>");
  });

  test("should handle whitespace-only text", async () => {
    const html = "<p>   </p>";
    const result = await preserveUtf8Text(html, "p", "Prefix: ");

    // Whitespace-only should not get prefix
    expect(result).not.toContain("Prefix:");
  });

  test("should replace multiple occurrences", async () => {
    const html = "<p>Hello Hello Hello</p>";
    const result = await replaceText(html, "p", "Hello", "Hi");

    // Only first occurrence should be replaced (using string.replace)
    // Count "Hi" occurrences
    const hiCount = (result.match(/Hi/g) || []).length;
    expect(hiCount).toBeGreaterThanOrEqual(1);
  });

  test("should use text chunk accumulation (implementation check)", async () => {
    // Read the source code to verify proper chunk handling
    const sourceCode = await Bun.file(import.meta.dir + "/../src/textrewriter.ts").text();

    // The fix requires checking lastInTextNode and accumulating text
    const usesLastInTextNode = sourceCode.includes("lastInTextNode");
    // This test FAILS because buggy code doesn't use lastInTextNode
    expect(usesLastInTextNode).toBe(true);
  });
});
