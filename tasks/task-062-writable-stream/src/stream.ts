// BUG: WritableStream backpressure is not handled, causing data loss
// Writes are fired without waiting for the stream to be ready

export interface WriteResult {
  chunks: string[];
  totalBytes: number;
  closed: boolean;
}

export function createCollectorStream(): {
  stream: WritableStream<string>;
  getResult: () => WriteResult;
} {
  const chunks: string[] = [];
  let totalBytes = 0;
  let closed = false;

  const stream = new WritableStream<string>({
    write(chunk) {
      // Simulate slow write operation
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          resolve();
        }, 50); // Slower to exacerbate timing issues
      });
    },
    close() {
      closed = true;
      console.log("Stream closed");
    },
    abort(reason) {
      console.error("Stream aborted:", reason);
    },
  });

  return {
    stream,
    getResult: () => ({ chunks: [...chunks], totalBytes, closed }),
  };
}

export async function writeDataBuggy(
  stream: WritableStream<string>,
  data: string[]
): Promise<WriteResult> {
  const writer = stream.getWriter();
  const results: string[] = [];

  try {
    for (const chunk of data) {
      // BUG: Not awaiting writer.ready before writing
      // This ignores backpressure and can cause data loss
      writer.write(chunk);
      // BUG: Also not awaiting the write promise itself
    }
    // BUG: Closing immediately without waiting for writes to complete
    writer.close();
  } catch (error) {
    writer.abort(error);
    throw error;
  }

  // BUG: Returning immediately without waiting for stream to close
  // This means data may not have been fully written yet
  return { chunks: results, totalBytes: 0, closed: false };
}

// Example usage
if (import.meta.main) {
  const { stream, getResult } = createCollectorStream();
  const testData = Array.from({ length: 100 }, (_, i) => `chunk-${i}`);

  const result = await writeDataBuggy(stream, testData);

  // Check immediately - stream is not closed, data may be lost
  const actualResult = getResult();
  console.log(`Expected ${testData.length} chunks, got ${actualResult.chunks.length}`);
  console.log(`Stream closed: ${actualResult.closed}`);
}
