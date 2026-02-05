// BUG: Loads entire file into memory instead of streaming with Bun.CryptoHasher
// Also uses text() which corrupts binary files due to encoding issues

export async function hashFile(filePath: string, algorithm: string = "sha256"): Promise<string> {
  // BUG: Reading entire file into memory at once
  // BUG: Using text() corrupts binary data - should use arrayBuffer() or streaming
  const content = await Bun.file(filePath).text();

  const hasher = new Bun.CryptoHasher(algorithm);
  hasher.update(content);

  return hasher.digest("hex");
}

export async function hashFileAsBytes(filePath: string, algorithm: string = "sha256"): Promise<string> {
  // BUG: Still loads entire file into memory (no streaming)
  // But at least uses bytes() to handle binary data correctly
  const content = await Bun.file(filePath).bytes();

  const hasher = new Bun.CryptoHasher(algorithm);
  hasher.update(content);

  return hasher.digest("hex");
}

export async function hashMultipleFiles(
  filePaths: string[],
  algorithm: string = "sha256"
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const filePath of filePaths) {
    // BUG: Each file is loaded entirely into memory
    const hash = await hashFile(filePath, algorithm);
    results.set(filePath, hash);
  }

  return results;
}

export async function verifyFileIntegrity(
  filePath: string,
  expectedHash: string,
  algorithm: string = "sha256"
): Promise<boolean> {
  const actualHash = await hashFile(filePath, algorithm);
  return actualHash === expectedHash;
}

// Track memory for debugging
export function getMemoryUsage(): { heapUsed: number; heapTotal: number } {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
  };
}

// Example usage
if (import.meta.main) {
  // Create a test file
  const testFile = "/tmp/test-hash-file.txt";
  await Bun.write(testFile, "Hello, World! This is test content for hashing.");

  console.log("Memory before:", getMemoryUsage());

  const hash = await hashFile(testFile);
  console.log("File hash:", hash);

  console.log("Memory after:", getMemoryUsage());

  const isValid = await verifyFileIntegrity(testFile, hash);
  console.log("Integrity check:", isValid);
}
