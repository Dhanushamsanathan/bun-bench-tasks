/**
 * Main thread code for worker error handling
 * BUG: Worker errors are not properly caught in the main thread
 */

export interface TaskMessage {
  type: "compute" | "validate" | "throw-error";
  data?: any;
}

export interface TaskResult {
  type: "success";
  result: any;
}

export interface WorkerError {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

export async function executeTask(task: TaskMessage): Promise<TaskResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url).href);

    worker.onmessage = (event: MessageEvent) => {
      const response = event.data;
      worker.terminate();
      resolve(response);
    };

    // BUG: onerror handler is set but doesn't reject the promise
    // The promise will hang forever if an error occurs
    worker.onerror = (error) => {
      console.error("Worker error:", error);
      // BUG: Missing reject() call - promise never resolves/rejects on error
      // BUG: Worker is not terminated
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
