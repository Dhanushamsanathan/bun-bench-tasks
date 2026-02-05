// FIXED: ReadableStream properly closes when all data is enqueued
// The controller.close() is called when there are no more chunks

export function createDataStream(chunks: string[]): ReadableStream<string> {
  let index = 0;

  return new ReadableStream<string>({
    start(controller) {
      // FIXED: Handle empty chunks array immediately
      if (chunks.length === 0) {
        controller.close();
      }
    },
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index++;

        // FIXED: Close the stream when all chunks have been enqueued
        if (index >= chunks.length) {
          controller.close();
        }
      }
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

// Example usage - this will complete properly now
if (import.meta.main) {
  const stream = createDataStream(["hello", "world", "!"]);
  console.log("Reading stream...");
  const data = await readAllData(stream);
  console.log("Data:", data);
  console.log("Stream completed successfully!");
}
