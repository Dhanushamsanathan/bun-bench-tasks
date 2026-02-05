// Simple application for cross-compilation testing

export function getPlatformInfo(): {
  platform: string;
  arch: string;
  runtime: string;
} {
  return {
    platform: process.platform,
    arch: process.arch,
    runtime: "bun",
  };
}

export function greet(name: string): string {
  const info = getPlatformInfo();
  return `Hello, ${name}! Running on ${info.platform} (${info.arch}) with ${info.runtime}`;
}

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// Main entry point
if (import.meta.main) {
  const info = getPlatformInfo();
  console.log("Platform Info:", JSON.stringify(info, null, 2));
  console.log(greet("World"));
  console.log("2 + 3 =", add(2, 3));
  console.log("4 * 5 =", multiply(4, 5));
}
