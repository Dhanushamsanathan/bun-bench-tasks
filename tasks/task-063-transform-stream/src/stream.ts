// BUG: TransformStream doesn't properly enqueue transformed data
// The transform function processes data but forgets to pass it downstream

export function createUppercaseTransform(): TransformStream<string, string> {
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      // Process the data
      const transformed = chunk.toUpperCase();

      // BUG: Missing controller.enqueue(transformed)
      // The transformed data is never passed to the readable side
      console.log("Transformed:", transformed);
      // Data disappears here because we don't enqueue it
    },
    flush(controller) {
      // BUG: Flush also doesn't signal completion properly
      console.log("Flush called");
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
          // BUG: Forgetting to enqueue parsed objects
          // controller.enqueue(parsed) is missing
        }
      }
    },
    flush(controller) {
      // Process remaining buffer
      if (buffer.trim()) {
        const parsed = JSON.parse(buffer);
        // BUG: Also missing enqueue here
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
}
