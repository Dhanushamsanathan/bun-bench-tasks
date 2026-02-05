// FIXED: Uses streaming with Bun.CryptoHasher for constant memory usage
// Reads file in chunks instead of loading entirely into memory
// Works correctly with binary files

export async function hashFile(filePath: string, algorithm: string = "sha256"): Promise<string> {
  const hasher = new Bun.CryptoHasher(algorithm);

  // FIXED: Use streaming to read file in chunks
  const file = Bun.file(filePath);
  const stream = file.stream();
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Update hasher with each chunk - constant memory usage
      hasher.update(value);
    }
  } finally {
    reader.releaseLock();
  }

  return hasher.digest("hex");
}

export async function hashFileAsBytes(filePath: string, algorithm: string = "sha256"): Promise<string> {
  // Alternative implementation using bytes() - still loads entire file
  // but at least handles binary data correctly
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
    // FIXED: Each file is now streamed, not loaded entirely
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

  // Create and hash a binary file to demonstrate correct handling
  const binaryFile = "/tmp/test-binary-file.bin";
  const binaryData = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    binaryData[i] = i;
  }
  await Bun.write(binaryFile, binaryData);

  console.log("\nBinary file hash:", await hashFile(binaryFile));
}
