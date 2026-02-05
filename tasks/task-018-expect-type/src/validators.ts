/**
 * Validation utilities with various return types.
 */

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Parses a string to a number.
 */
export function parseNumber(value: string): number {
  return parseInt(value, 10);
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): ValidationResult {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
    valid: isValid,
    errors: isValid ? undefined : ["Invalid email format"],
  };
}

/**
 * Normalizes user data.
 */
export function normalizeUser(data: {
  name: string;
  age: string;
}): { name: string; age: number } {
  return {
    name: data.name.trim().toLowerCase(),
    age: parseInt(data.age, 10),
  };
}

/**
 * Gets default options merged with provided options.
 */
export function getOptions(custom?: Partial<{
  timeout: number;
  retries: number;
  debug: boolean;
}>): { timeout: number; retries: number; debug: boolean } {
  return {
    timeout: 5000,
    retries: 3,
    debug: false,
    ...custom,
  };
}

/**
 * Filters an array removing falsy values.
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | "")[]): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * Creates a sparse array with holes.
 */
export function createSparseArray(): (number | undefined)[] {
  const arr = new Array(5);
  arr[0] = 1;
  arr[2] = 3;
  arr[4] = 5;
  return arr;
}

/**
 * Returns status code as string or number based on input.
 */
export function getStatusCode(asString: boolean): string | number {
  return asString ? "200" : 200;
}

/**
 * Checks if value is empty (null, undefined, empty string, empty array).
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
