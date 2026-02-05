/**
 * Main thread code for worker message passing - FIXED
 * Solution: Serialize complex types to JSON-safe format and reconstruct on receive
 */

export interface UserData {
  id: number;
  name: string;
  createdAt: Date;
  tags: Set<string>;
  metadata: Map<string, any>;
}

// Serializable versions of the interfaces
export interface SerializedUserData {
  id: number;
  name: string;
  createdAt: string; // ISO string
  tags: string[]; // Array instead of Set
  metadata: [string, any][]; // Entries array instead of Map
}

export interface WorkerMessage {
  type: "process";
  data: SerializedUserData;
}

export interface WorkerResponse {
  type: "result";
  data: SerializedUserData;
  processedAt: string; // ISO string
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

// FIX: Serialize UserData to a structured clone-safe format
export function serializeUserData(userData: UserData): SerializedUserData {
  return {
    id: userData.id,
    name: userData.name,
    createdAt: userData.createdAt.toISOString(),
    tags: Array.from(userData.tags),
    metadata: Array.from(userData.metadata.entries()),
  };
}

// FIX: Deserialize back to proper types
export function deserializeUserData(data: SerializedUserData): UserData {
  return {
    id: data.id,
    name: data.name,
    createdAt: new Date(data.createdAt),
    tags: new Set(data.tags),
    metadata: new Map(data.metadata),
  };
}

export async function sendToWorker(userData: UserData): Promise<{
  type: "result";
  data: UserData;
  processedAt: Date;
}> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url).href);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      // FIX: Reconstruct types from the serialized response
      const response = event.data;
      worker.terminate();

      resolve({
        type: response.type,
        data: deserializeUserData(response.data),
        processedAt: new Date(response.processedAt),
      });
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    // FIX: Serialize complex objects before sending
    const message: WorkerMessage = {
      type: "process",
      data: serializeUserData(userData),
    };

    worker.postMessage(message);
  });
}

export async function processUserData(userData: UserData): Promise<{
  type: "result";
  data: UserData;
  processedAt: Date;
}> {
  const response = await sendToWorker(userData);
  return response;
}
