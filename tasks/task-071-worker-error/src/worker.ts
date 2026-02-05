/**
 * Worker code that may throw errors
 * BUG: Errors are thrown but not properly communicated back
 */

declare var self: Worker;

interface TaskMessage {
  type: "compute" | "validate" | "throw-error";
  data?: any;
}

interface TaskResult {
  type: "success";
  result: any;
}

self.onmessage = (event: MessageEvent<TaskMessage>) => {
  const message = event.data;

  // BUG: Errors thrown here won't be properly caught by main thread
  // because onerror doesn't reject the promise

  if (message.type === "compute") {
    if (typeof message.data !== "number") {
      // BUG: This error won't be caught properly
      throw new Error("Invalid input: expected a number");
    }
    const result: TaskResult = {
      type: "success",
      result: message.data * 2,
    };
    self.postMessage(result);
  } else if (message.type === "validate") {
    if (typeof message.data !== "string") {
      throw new Error("Invalid input: expected a string");
    }
    const result: TaskResult = {
      type: "success",
      result: message.data.length > 0,
    };
    self.postMessage(result);
  } else if (message.type === "throw-error") {
    // Intentionally throw an error for testing
    throw new Error("Intentional worker error for testing");
  }
};
