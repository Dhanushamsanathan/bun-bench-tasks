// Utility functions that will be minified
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error("Cannot calculate average of empty array");
  }
  return calculateSum(numbers) / numbers.length;
}

export function findMax(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error("Cannot find max of empty array");
  }
  return Math.max(...numbers);
}

export function findMin(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error("Cannot find min of empty array");
  }
  return Math.min(...numbers);
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  return formatter.format(amount);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export class DataProcessor {
  private data: number[] = [];

  add(value: number): void {
    this.data.push(value);
  }

  getStats() {
    return {
      sum: calculateSum(this.data),
      average: this.data.length > 0 ? calculateAverage(this.data) : 0,
      max: this.data.length > 0 ? findMax(this.data) : 0,
      min: this.data.length > 0 ? findMin(this.data) : 0,
      count: this.data.length,
    };
  }

  clear(): void {
    this.data = [];
  }
}
