import { test, expect, describe } from "bun:test";
import {
  formatCurrency,
  formatDate,
  generateSlug,
  formatPhone,
  truncateText,
  formatFileSize,
  formatList,
} from "../src/formatter";

describe("formatCurrency", () => {
  // BUG: Stale snapshot - formatCurrency now includes currency symbol
  test("formats USD amount", () => {
    const result = formatCurrency(1234.56);
    // BUG: Old snapshot shows "1234.56" but new output is "$1,234.56"
    expect(result).toMatchInlineSnapshot(`"1234.56"`);
  });

  // BUG: Stale snapshot - EUR symbol not in old snapshot
  test("formats EUR amount", () => {
    const result = formatCurrency(999.99, "EUR");
    // BUG: Old snapshot shows "999.99" but new output is "€999.99"
    expect(result).toMatchInlineSnapshot(`"999.99"`);
  });

  // BUG: Large numbers now have thousand separators
  test("formats large amount", () => {
    const result = formatCurrency(1000000);
    // BUG: Old snapshot lacks comma separators
    expect(result).toMatchInlineSnapshot(`"1000000.00"`);
  });
});

describe("formatDate", () => {
  // BUG: Stale snapshot - date format completely changed
  test("formats date correctly", () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    const result = formatDate(date);
    // BUG: Old format was "01/15/2024", new format is "January 15, 2024"
    expect(result).toMatchInlineSnapshot(`"01/15/2024"`);
  });

  // BUG: Different month showing old format
  test("formats date in December", () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    const result = formatDate(date);
    // BUG: Old snapshot shows MM/DD/YYYY format
    expect(result).toMatchInlineSnapshot(`"12/25/2024"`);
  });
});

describe("generateSlug", () => {
  // BUG: Stale snapshot - special char handling changed
  test("generates slug from title", () => {
    const result = generateSlug("Hello World!");
    // BUG: Old code kept "!", new code removes it
    expect(result).toMatchInlineSnapshot(`"hello-world!"`);
  });

  // BUG: Multiple spaces handling changed
  test("handles multiple spaces", () => {
    const result = generateSlug("Hello    World");
    // BUG: Old code created "hello----world", new code creates "hello-world"
    expect(result).toMatchInlineSnapshot(`"hello----world"`);
  });

  // BUG: Leading/trailing space handling changed
  test("trims leading and trailing spaces", () => {
    const result = generateSlug("  Hello World  ");
    // BUG: Old code created "-hello-world-", new code trims hyphens
    expect(result).toMatchInlineSnapshot(`"-hello-world-"`);
  });
});

describe("formatPhone", () => {
  // BUG: Phone format completely changed
  test("formats phone number", () => {
    const result = formatPhone("1234567890");
    // BUG: Old format was "123-456-7890", new format is "(123) 456-7890"
    expect(result).toMatchInlineSnapshot(`"123-456-7890"`);
  });

  // BUG: Same format issue
  test("formats phone with existing formatting", () => {
    const result = formatPhone("123-456-7890");
    // BUG: Old format maintained dashes only
    expect(result).toMatchInlineSnapshot(`"123-456-7890"`);
  });
});

describe("truncateText", () => {
  // BUG: Ellipsis character changed
  test("truncates long text", () => {
    const result = truncateText("Hello World, this is a long text", 15);
    // BUG: Old code used "...", new code uses "…" (unicode ellipsis)
    expect(result).toMatchInlineSnapshot(`"Hello World, th..."`);
  });

  // This one should still work - no truncation needed
  test("keeps short text unchanged", () => {
    const result = truncateText("Short", 10);
    expect(result).toMatchInlineSnapshot(`"Short"`);
  });
});

describe("formatFileSize", () => {
  // BUG: Unit naming changed from KB to KiB
  test("formats kilobytes", () => {
    const result = formatFileSize(1536);
    // BUG: Old output "1.50 KB", new output "1.50 KiB"
    expect(result).toMatchInlineSnapshot(`"1.50 KB"`);
  });

  // BUG: Same unit naming issue for MB
  test("formats megabytes", () => {
    const result = formatFileSize(2621440);
    // BUG: Old output "2.50 MB", new output "2.50 MiB"
    expect(result).toMatchInlineSnapshot(`"2.50 MB"`);
  });

  // Bytes should be unchanged
  test("formats bytes", () => {
    const result = formatFileSize(500);
    expect(result).toMatchInlineSnapshot(`"500 B"`);
  });
});

describe("formatList", () => {
  // BUG: Oxford comma was added
  test("formats list of three items", () => {
    const result = formatList(["apples", "bananas", "oranges"]);
    // BUG: Old code produced "apples, bananas and oranges"
    // New code produces "apples, bananas, and oranges" (Oxford comma)
    expect(result).toMatchInlineSnapshot(`"apples, bananas and oranges"`);
  });

  // BUG: Same Oxford comma issue
  test("formats list of four items", () => {
    const result = formatList(["red", "green", "blue", "yellow"]);
    // BUG: Missing Oxford comma in old snapshot
    expect(result).toMatchInlineSnapshot(`"red, green, blue and yellow"`);
  });

  // These should work - no Oxford comma for 2 items
  test("formats list of two items", () => {
    const result = formatList(["yes", "no"]);
    expect(result).toMatchInlineSnapshot(`"yes and no"`);
  });

  test("formats single item", () => {
    const result = formatList(["only"]);
    expect(result).toMatchInlineSnapshot(`"only"`);
  });
});
