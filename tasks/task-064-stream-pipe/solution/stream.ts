// FIXED: Stream pipeline properly handles errors
// Errors are caught and resources are cleaned up properly

export function createSourceStream(
  data: string[],
  errorAtIndex?: number
): ReadableStream<string> {
  let index = 0;

  return new ReadableStream<string>({
    pull(controller) {
      if (index < data.length) {
        // Inject error at specific index for testing
        if (errorAtIndex !== undefined && index === errorAtIndex) {
          controller.error(new Error(`Source error at index ${index}`));
          return;
        }
        controller.enqueue(data[index]);
        index++;
      } else {
        controller.close();
      }
    },
  });
}

export function createTransformWithError(
  errorOnChunk?: string
): TransformStream<string, string> {
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      // Inject error on specific chunk for testing
      if (errorOnChunk && chunk === errorOnChunk) {
        controller.error(new Error(`Transform error on chunk: ${chunk}`));
        return;
      }
      controller.enqueue(chunk.toUpperCase());
    },
  });
}

export function createSinkStream(
  results: string[],
  errorOnChunk?: string
): WritableStream<string> {
  return new WritableStream<string>({
    write(chunk) {
      // Inject error on specific chunk for testing
      if (errorOnChunk && chunk === errorOnChunk) {
        throw new Error(`Sink error on chunk: ${chunk}`);
      }
      results.push(chunk);
    },
  });
}

export interface PipelineResult {
  success: boolean;
  data: string[];
  error?: Error;
}

export async function runPipeline(
  source: ReadableStream<string>,
  transforms: TransformStream<string, string>[],
  sink: WritableStream<string>,
  results: string[]
): Promise<PipelineResult> {
  // FIXED: Wrap pipeline in try-catch for error handling
  try {
    let stream: ReadableStream<string> = source;

    for (const transform of transforms) {
      stream = stream.pipeThrough(transform);
    }

    // FIXED: Catch errors from pipeTo and handle them
    await stream.pipeTo(sink, {
      // FIXED: Configure pipeline behavior on errors
      preventClose: false,
      preventAbort: false,
      preventCancel: false,
    });

    return { success: true, data: results };
  } catch (error) {
    // FIXED: Return error information instead of crashing
    return {
      success: false,
      data: results, // Return any data collected before the error
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function runPipelineWithData(
  data: string[],
  errorAtSource?: number,
  errorAtTransform?: string,
  errorAtSink?: string
): Promise<PipelineResult> {
  const results: string[] = [];

  const source = createSourceStream(data, errorAtSource);
  const transform = createTransformWithError(errorAtTransform);
  const sink = createSinkStream(results, errorAtSink);

  // FIXED: Pass results array to capture partial data on error
  return await runPipeline(source, [transform], sink, results);
}

// Example usage
if (import.meta.main) {
  console.log("Running pipeline with error...");

  const result = await runPipelineWithData(
    ["hello", "error", "world"],
    undefined,
    "error"
  );

  console.log("Result:", result);
  console.log("Error handled gracefully!");

  console.log("\nRunning successful pipeline...");
  const successResult = await runPipelineWithData(["hello", "world", "test"]);
  console.log("Success result:", successResult);
}
