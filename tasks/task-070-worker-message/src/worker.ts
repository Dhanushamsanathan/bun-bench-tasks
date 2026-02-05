/**
 * Worker code for message processing
 * BUG: Does not properly handle type reconstruction
 */

declare var self: Worker;

interface UserData {
  id: number;
  name: string;
  createdAt: Date;
  tags: Set<string>;
  metadata: Map<string, any>;
}

interface WorkerMessage {
  type: "process";
  data: UserData;
}

interface WorkerResponse {
  type: "result";
  data: UserData;
  processedAt: Date;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === "process") {
    // BUG: The data received here has lost its type information
    // createdAt is a string, not a Date
    // tags is an object or array, not a Set
    // metadata is an object, not a Map

    const processedData: UserData = {
      ...message.data,
      // BUG: Not reconstructing the Date object
      createdAt: message.data.createdAt,
      // BUG: Not reconstructing the Set
      tags: message.data.tags,
      // BUG: Not reconstructing the Map
      metadata: message.data.metadata,
    };

    const response: WorkerResponse = {
      type: "result",
      data: processedData,
      // BUG: Sending Date directly, will be serialized
      processedAt: new Date(),
    };

    self.postMessage(response);
  }
};
