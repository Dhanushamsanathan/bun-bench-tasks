/**
 * Worker code for message processing - FIXED
 * Solution: Work with serialized formats consistently
 */

declare var self: Worker;

// Serializable versions of the interfaces
interface SerializedUserData {
  id: number;
  name: string;
  createdAt: string; // ISO string
  tags: string[]; // Array instead of Set
  metadata: [string, any][]; // Entries array instead of Map
}

interface WorkerMessage {
  type: "process";
  data: SerializedUserData;
}

interface WorkerResponse {
  type: "result";
  data: SerializedUserData;
  processedAt: string; // ISO string
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === "process") {
    // FIX: Work with the serialized data format
    // The data is already in a serializable format, so we can process it directly
    const processedData: SerializedUserData = {
      id: message.data.id,
      name: message.data.name,
      createdAt: message.data.createdAt, // Already an ISO string
      tags: message.data.tags, // Already an array
      metadata: message.data.metadata, // Already entries array
    };

    const response: WorkerResponse = {
      type: "result",
      data: processedData,
      // FIX: Send Date as ISO string for proper serialization
      processedAt: new Date().toISOString(),
    };

    self.postMessage(response);
  }
};
