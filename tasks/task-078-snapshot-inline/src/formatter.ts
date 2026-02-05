/**
 * Formatting utilities for display purposes.
 * NOTE: These implementations have been updated from the original version.
 */

/**
 * Formats a number as currency.
 * UPDATED: Now includes currency symbol and uses locale formatting.
 * OLD: Just returned the number with 2 decimal places like "1234.56"
 * NEW: Returns formatted string like "$1,234.56"
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "\u20AC",
    GBP: "\u00A3",
    JPY: "\u00A5",
  };

  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

/**
 * Formats a date for display.
 * UPDATED: Now uses ISO-like format with full month name.
 * OLD: Returned "MM/DD/YYYY" format like "01/15/2024"
 * NEW: Returns "Month DD, YYYY" format like "January 15, 2024"
 */
export function formatDate(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Generates a URL-friendly slug from a string.
 * UPDATED: Now handles special characters and consecutive spaces better.
 * OLD: Just lowercased and replaced spaces with hyphens
 * NEW: Removes special chars, handles consecutive spaces, trims hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Trim hyphens from ends
}

/**
 * Formats a phone number for display.
 * UPDATED: Now formats as (XXX) XXX-XXXX instead of XXX-XXX-XXXX
 */
export function formatPhone(digits: string): string {
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length !== 10) {
    return digits; // Return original if not valid
  }
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Truncates text with ellipsis.
 * UPDATED: Now adds ellipsis character instead of "..."
 * OLD: "Hello World..."
 * NEW: "Hello World\u2026"
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "\u2026";
}

/**
 * Formats file size for display.
 * UPDATED: Now uses binary units (KiB, MiB) instead of decimal (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * Formats a list as a human-readable string.
 * UPDATED: Now uses Oxford comma
 * OLD: "apples, bananas and oranges"
 * NEW: "apples, bananas, and oranges"
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(", ")}, and ${lastItem}`;
}
