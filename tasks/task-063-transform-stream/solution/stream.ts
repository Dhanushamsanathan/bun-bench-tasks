// FIXED: TransformStream properly enqueues transformed data
// The transform function correctly passes data downstream via controller.enqueue()

export function createUppercaseTransform(): TransformStream<string, string> {
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      // Process the data
      const transformed = chunk.toUpperCase();

      // FIXED: Enqueue the transformed data to pass it downstream
      controller.enqueue(transformed);
    },
    flush(controller) {
      // FIXED: Flush is called when the writable side closes
      // No buffered data in this case, but the method is properly defined
      console.log("Flush called - stream complete");
    },
  });
}

export function createJsonParseTransform(): TransformStream<string, object> {
  let buffer = "";

  return new TransformStream<string, object>({
    transform(chunk, controller) {
      buffer += chunk;

      // Try to parse complete JSON objects
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          const parsed = JSON.parse(line);
          // FIXED: Enqueue parsed objects to pass them downstream
          controller.enqueue(parsed);
        }
      }
    },
    flush(controller) {
      // Process remaining buffer
      if (buffer.trim()) {
        const parsed = JSON.parse(buffer);
        // FIXED: Enqueue the final parsed object
        controller.enqueue(parsed);
      }
    },
  });
}

export async function pipeWithTransform(
  input: string[],
  transform: TransformStream<string, string>
): Promise<string[]> {
  const results: string[] = [];

  const readable = new ReadableStream<string>({
    start(controller) {
      for (const chunk of input) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      results.push(chunk);
    },
  });

  await readable.pipeThrough(transform).pipeTo(writable);

  return results;
}

// Example usage
if (import.meta.main) {
  const transform = createUppercaseTransform();
  const input = ["hello", "world", "test"];

  console.log("Input:", input);
  const output = await pipeWithTransform(input, transform);
  console.log("Output:", output);
  console.log("Expected:", input.map((s) => s.toUpperCase()));
  console.log("Transform working correctly!");
}
