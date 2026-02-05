// FIXED: WritableStream properly handles backpressure
// All writes await ready and the write promise before continuing

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
      // FIXED: Wait for the writer to be ready (backpressure handling)
      await writer.ready;
      // FIXED: Await the write operation to complete before continuing
      await writer.write(chunk);
      results.push(chunk);
    }
    // FIXED: Wait for all writes to complete before closing
    await writer.ready;
    await writer.close();
  } catch (error) {
    await writer.abort(error);
    throw error;
  } finally {
    writer.releaseLock();
  }

  // FIXED: Function now waits for all operations to complete
  return {
    chunks: results,
    totalBytes: results.reduce((sum, s) => sum + s.length, 0),
    closed: true,
  };
}

// Example usage
if (import.meta.main) {
  const { stream, getResult } = createCollectorStream();
  const testData = Array.from({ length: 100 }, (_, i) => `chunk-${i}`);

  const result = await writeDataBuggy(stream, testData);

  // Check immediately - data should be fully written now
  const actualResult = getResult();
  console.log(`Expected ${testData.length} chunks, got ${actualResult.chunks.length}`);
  console.log(`Stream closed: ${actualResult.closed}`);
  console.log("All data written successfully!");
}
