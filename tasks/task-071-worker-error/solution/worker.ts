/**
 * Worker code that may throw errors - FIXED
 * Solution: Wrap message handling in try-catch and send error messages
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

interface ErrorResult {
  type: "error";
  message: string;
  stack?: string;
}

self.onmessage = (event: MessageEvent<TaskMessage>) => {
  const message = event.data;

  // FIX: Wrap in try-catch to properly communicate errors back to main thread
  try {
    if (message.type === "compute") {
      if (typeof message.data !== "number") {
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
    } else {
      throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    // FIX: Send error back to main thread as a message
    const errorResult: ErrorResult = {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    self.postMessage(errorResult);
  }
};

// FIX: Handle any uncaught errors in the worker
self.onerror = (event: ErrorEvent) => {
  const errorResult: ErrorResult = {
    type: "error",
    message: event.message || "Uncaught worker error",
  };
  self.postMessage(errorResult);
};
