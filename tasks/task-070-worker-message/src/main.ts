/**
 * Main thread code for worker message passing
 * BUG: Complex objects lose their data types during serialization
 */

export interface UserData {
  id: number;
  name: string;
  createdAt: Date;
  tags: Set<string>;
  metadata: Map<string, any>;
}

export interface WorkerMessage {
  type: "process";
  data: UserData;
}

export interface WorkerResponse {
  type: "result";
  data: UserData;
  processedAt: Date;
}

export function createUserData(): UserData {
  return {
    id: 1,
    name: "Test User",
    createdAt: new Date("2024-01-15T10:30:00Z"),
    tags: new Set(["admin", "active"]),
    metadata: new Map([
      ["role", "administrator"],
      ["level", 5],
    ]),
  };
}

export async function sendToWorker(userData: UserData): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url).href);

    worker.onmessage = (event: MessageEvent) => {
      // BUG: Directly using event.data without reconstructing types
      // The Date, Set, and Map objects are not properly deserialized
      const response: WorkerResponse = event.data;
      worker.terminate();
      resolve(response);
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    // BUG: Sending complex objects directly without proper serialization
    // Set and Map cannot be cloned by structured clone algorithm
    const message: WorkerMessage = {
      type: "process",
      data: userData,
    };

    worker.postMessage(message);
  });
}

export async function processUserData(userData: UserData): Promise<WorkerResponse> {
  const response = await sendToWorker(userData);
  return response;
}
