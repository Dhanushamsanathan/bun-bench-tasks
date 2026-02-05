// BUG: Stream pipeline doesn't handle errors properly
// Errors in the middle of the pipeline cause unhandled crashes

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
  sink: WritableStream<string>
): Promise<PipelineResult> {
  const data: string[] = [];

  // BUG: No try-catch around the pipeline
  // BUG: No error handling options passed to pipeTo
  let stream: ReadableStream<string> = source;

  for (const transform of transforms) {
    stream = stream.pipeThrough(transform);
  }

  // BUG: Not catching errors from pipeTo
  // BUG: Not using preventAbort/preventCancel/preventClose options
  await stream.pipeTo(sink);

  return { success: true, data };
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

  // BUG: Errors not caught, will crash
  await runPipeline(source, [transform], sink);

  return { success: true, data: results };
}

// Example usage
if (import.meta.main) {
  console.log("Running pipeline with error...");

  // This will crash because errors aren't handled
  const result = await runPipelineWithData(
    ["hello", "error", "world"],
    undefined,
    "error"
  );

  console.log("Result:", result);
}
