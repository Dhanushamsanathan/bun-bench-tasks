/**
 * Main thread code for worker lifecycle management
 * BUG: Worker is not properly terminated after use
 */

export interface WorkerTask {
  type: "start-monitoring" | "get-status" | "stop";
  interval?: number;
}

export interface WorkerStatus {
  type: "status";
  running: boolean;
  tickCount: number;
  startedAt: string;
}

export interface MonitoringResult {
  type: "monitoring-started" | "monitoring-stopped";
  tickCount?: number;
}

// Track active workers (for testing)
export const activeWorkers: Worker[] = [];

export function createMonitoringWorker(): Worker {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href);
  activeWorkers.push(worker);
  return worker;
}

export async function startMonitoring(intervalMs: number = 100): Promise<Worker> {
  return new Promise((resolve) => {
    const worker = createMonitoringWorker();

    worker.onmessage = (event: MessageEvent<MonitoringResult>) => {
      if (event.data.type === "monitoring-started") {
        resolve(worker);
      }
    };

    const task: WorkerTask = {
      type: "start-monitoring",
      interval: intervalMs,
    };
    worker.postMessage(task);
  });
}

export async function getWorkerStatus(worker: Worker): Promise<WorkerStatus> {
  return new Promise((resolve) => {
    const handler = (event: MessageEvent<WorkerStatus>) => {
      if (event.data.type === "status") {
        worker.removeEventListener("message", handler);
        resolve(event.data);
      }
    };
    worker.addEventListener("message", handler);

    const task: WorkerTask = { type: "get-status" };
    worker.postMessage(task);
  });
}

export async function stopMonitoring(worker: Worker): Promise<number> {
  return new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent<MonitoringResult>) => {
      if (event.data.type === "monitoring-stopped") {
        // BUG: Worker is not terminated after stopping
        // The worker continues to exist and could be restarted
        // BUG: Not removing from activeWorkers array
        resolve(event.data.tickCount || 0);
      }
    };

    const task: WorkerTask = { type: "stop" };
    worker.postMessage(task);
  });
}

// BUG: This function doesn't actually terminate anything
export function terminateAllWorkers(): void {
  // BUG: Just clears the array reference without terminating workers
  activeWorkers.length = 0;
}

// Function to run a quick task and forget about cleanup
export async function runQuickTask(): Promise<number> {
  const worker = createMonitoringWorker();

  return new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === "monitoring-started") {
        // Get status after a brief moment
        setTimeout(() => {
          worker.postMessage({ type: "get-status" });
        }, 50);
      } else if (event.data.type === "status") {
        // BUG: Worker is not terminated!
        // It will keep running its interval in the background
        resolve(event.data.tickCount);
      }
    };

    worker.postMessage({ type: "start-monitoring", interval: 10 });
  });
}
