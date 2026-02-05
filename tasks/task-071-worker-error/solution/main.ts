/**
 * Main thread code for worker error handling - FIXED
 * Solution: Properly set up error handlers and reject promises on errors
 */

export interface TaskMessage {
  type: "compute" | "validate" | "throw-error";
  data?: any;
}

export interface TaskResult {
  type: "success";
  result: any;
}

export interface ErrorResult {
  type: "error";
  message: string;
  stack?: string;
}

export interface WorkerError {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

export async function executeTask(task: TaskMessage): Promise<TaskResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url).href);

    // FIX: Set up a timeout to prevent hanging promises
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Worker timeout"));
    }, 30000);

    worker.onmessage = (event: MessageEvent<TaskResult | ErrorResult>) => {
      clearTimeout(timeout);
      const response = event.data;

      // FIX: Handle error messages sent from worker's try-catch
      if (response.type === "error") {
        worker.terminate();
        const error = new Error((response as ErrorResult).message);
        if ((response as ErrorResult).stack) {
          error.stack = (response as ErrorResult).stack;
        }
        reject(error);
        return;
      }

      worker.terminate();
      resolve(response as TaskResult);
    };

    // FIX: Properly handle uncaught errors from the worker
    worker.onerror = (event: ErrorEvent) => {
      clearTimeout(timeout);
      worker.terminate();

      // Create an error with details from the event
      const error = new Error(event.message || "Unknown worker error");
      reject(error);
    };

    // FIX: Handle message deserialization errors
    worker.onmessageerror = (event: MessageEvent) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error("Failed to deserialize message from worker"));
    };

    worker.postMessage(task);
  });
}

export async function computeValue(value: number): Promise<number> {
  const result = await executeTask({ type: "compute", data: value });
  return result.result;
}

export async function validateInput(input: string): Promise<boolean> {
  const result = await executeTask({ type: "validate", data: input });
  return result.result;
}

export async function triggerWorkerError(): Promise<TaskResult> {
  // This should throw an error in the worker
  return executeTask({ type: "throw-error" });
}
