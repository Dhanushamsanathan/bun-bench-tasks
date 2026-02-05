// BUG: ReadableStream is never closed, causing resource leak
// The controller.close() is missing, so the stream stays open indefinitely

export function createDataStream(chunks: string[]): ReadableStream<string> {
  let index = 0;

  return new ReadableStream<string>({
    start(controller) {
      // Initial setup
    },
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index++;
      }
      // BUG: Missing controller.close() when all chunks are enqueued
      // The stream never signals completion, causing consumers to wait forever
    },
    cancel(reason) {
      console.log("Stream cancelled:", reason);
    },
  });
}

export async function readAllData(stream: ReadableStream<string>): Promise<string[]> {
  const reader = stream.getReader();
  const results: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      results.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return results;
}

// Example usage - this will hang because stream never closes
if (import.meta.main) {
  const stream = createDataStream(["hello", "world", "!"]);
  console.log("Reading stream (this will hang)...");
  const data = await readAllData(stream);
  console.log("Data:", data);
}
