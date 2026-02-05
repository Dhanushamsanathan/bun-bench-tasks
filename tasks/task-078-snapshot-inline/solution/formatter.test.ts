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
  // FIXED: Updated snapshot to include currency symbol and formatting
  test("formats USD amount", () => {
    const result = formatCurrency(1234.56);
    // FIXED: New format includes "$" symbol and comma separator
    expect(result).toMatchInlineSnapshot(`"$1,234.56"`);
  });

  // FIXED: Updated snapshot with EUR symbol
  test("formats EUR amount", () => {
    const result = formatCurrency(999.99, "EUR");
    // FIXED: New format includes "€" symbol
    expect(result).toMatchInlineSnapshot(`"\u20AC999.99"`);
  });

  // FIXED: Large numbers have thousand separators
  test("formats large amount", () => {
    const result = formatCurrency(1000000);
    // FIXED: Includes commas as thousand separators
    expect(result).toMatchInlineSnapshot(`"$1,000,000.00"`);
  });

  // Additional tests for other currencies
  test("formats GBP amount", () => {
    const result = formatCurrency(50.0, "GBP");
    expect(result).toMatchInlineSnapshot(`"\u00A350.00"`);
  });

  test("formats JPY amount", () => {
    const result = formatCurrency(10000, "JPY");
    expect(result).toMatchInlineSnapshot(`"\u00A510,000.00"`);
  });
});

describe("formatDate", () => {
  // FIXED: Updated snapshot with new date format
  test("formats date correctly", () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    const result = formatDate(date);
    // FIXED: New format is "Month DD, YYYY"
    expect(result).toMatchInlineSnapshot(`"January 15, 2024"`);
  });

  // FIXED: Updated to new format
  test("formats date in December", () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    const result = formatDate(date);
    // FIXED: Full month name format
    expect(result).toMatchInlineSnapshot(`"December 25, 2024"`);
  });

  // Additional date tests
  test("formats single digit day", () => {
    const date = new Date(2024, 5, 1); // June 1, 2024
    const result = formatDate(date);
    expect(result).toMatchInlineSnapshot(`"June 1, 2024"`);
  });
});

describe("generateSlug", () => {
  // FIXED: Updated snapshot without special characters
  test("generates slug from title", () => {
    const result = generateSlug("Hello World!");
    // FIXED: Special characters are now removed
    expect(result).toMatchInlineSnapshot(`"hello-world"`);
  });

  // FIXED: Multiple spaces collapse to single hyphen
  test("handles multiple spaces", () => {
    const result = generateSlug("Hello    World");
    // FIXED: Multiple spaces become single hyphen
    expect(result).toMatchInlineSnapshot(`"hello-world"`);
  });

  // FIXED: Leading/trailing hyphens are trimmed
  test("trims leading and trailing spaces", () => {
    const result = generateSlug("  Hello World  ");
    // FIXED: No leading/trailing hyphens
    expect(result).toMatchInlineSnapshot(`"hello-world"`);
  });

  // Additional slug tests
  test("handles special characters in middle", () => {
    const result = generateSlug("Hello & World @ 2024!");
    expect(result).toMatchInlineSnapshot(`"hello-world-2024"`);
  });
});

describe("formatPhone", () => {
  // FIXED: Updated to new phone format
  test("formats phone number", () => {
    const result = formatPhone("1234567890");
    // FIXED: New format is "(XXX) XXX-XXXX"
    expect(result).toMatchInlineSnapshot(`"(123) 456-7890"`);
  });

  // FIXED: Same new format for already formatted input
  test("formats phone with existing formatting", () => {
    const result = formatPhone("123-456-7890");
    // FIXED: Digits extracted and reformatted
    expect(result).toMatchInlineSnapshot(`"(123) 456-7890"`);
  });

  // Additional phone tests
  test("returns original for invalid length", () => {
    const result = formatPhone("12345");
    expect(result).toMatchInlineSnapshot(`"12345"`);
  });
});

describe("truncateText", () => {
  // FIXED: Updated to use unicode ellipsis
  test("truncates long text", () => {
    const result = truncateText("Hello World, this is a long text", 15);
    // FIXED: Uses unicode ellipsis character (\u2026) instead of "..."
    expect(result).toMatchInlineSnapshot(`"Hello World, th\u2026"`);
  });

  // Still works - no truncation needed
  test("keeps short text unchanged", () => {
    const result = truncateText("Short", 10);
    expect(result).toMatchInlineSnapshot(`"Short"`);
  });

  // Additional truncation tests
  test("handles exact length", () => {
    const result = truncateText("Hello", 5);
    expect(result).toMatchInlineSnapshot(`"Hello"`);
  });
});

describe("formatFileSize", () => {
  // FIXED: Updated to binary units (KiB)
  test("formats kilobytes", () => {
    const result = formatFileSize(1536);
    // FIXED: Uses KiB (kibibytes) instead of KB
    expect(result).toMatchInlineSnapshot(`"1.50 KiB"`);
  });

  // FIXED: Updated to binary units (MiB)
  test("formats megabytes", () => {
    const result = formatFileSize(2621440);
    // FIXED: Uses MiB (mebibytes) instead of MB
    expect(result).toMatchInlineSnapshot(`"2.50 MiB"`);
  });

  // Bytes unchanged
  test("formats bytes", () => {
    const result = formatFileSize(500);
    expect(result).toMatchInlineSnapshot(`"500 B"`);
  });

  // Additional file size tests
  test("formats gigabytes", () => {
    const result = formatFileSize(1610612736); // 1.5 GiB
    expect(result).toMatchInlineSnapshot(`"1.50 GiB"`);
  });
});

describe("formatList", () => {
  // FIXED: Updated with Oxford comma
  test("formats list of three items", () => {
    const result = formatList(["apples", "bananas", "oranges"]);
    // FIXED: Now includes Oxford comma before "and"
    expect(result).toMatchInlineSnapshot(`"apples, bananas, and oranges"`);
  });

  // FIXED: Updated with Oxford comma
  test("formats list of four items", () => {
    const result = formatList(["red", "green", "blue", "yellow"]);
    // FIXED: Oxford comma included
    expect(result).toMatchInlineSnapshot(`"red, green, blue, and yellow"`);
  });

  // Two items - no Oxford comma needed
  test("formats list of two items", () => {
    const result = formatList(["yes", "no"]);
    expect(result).toMatchInlineSnapshot(`"yes and no"`);
  });

  test("formats single item", () => {
    const result = formatList(["only"]);
    expect(result).toMatchInlineSnapshot(`"only"`);
  });

  // Additional list tests
  test("formats empty list", () => {
    const result = formatList([]);
    expect(result).toMatchInlineSnapshot(`""`);
  });
});
