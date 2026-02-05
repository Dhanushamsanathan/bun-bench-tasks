/**
 * Main thread code for worker lifecycle management - FIXED
 * Solution: Properly terminate workers and clean up resources
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

// Track active workers (for testing and cleanup)
export const activeWorkers: Worker[] = [];

export function createMonitoringWorker(): Worker {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href);
  activeWorkers.push(worker);
  return worker;
}

// FIX: Helper to remove worker from tracking array
function removeFromActiveWorkers(worker: Worker): void {
  const index = activeWorkers.indexOf(worker);
  if (index > -1) {
    activeWorkers.splice(index, 1);
  }
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
        // FIX: Terminate the worker after receiving stop confirmation
        worker.terminate();
        // FIX: Remove from tracking array
        removeFromActiveWorkers(worker);
        resolve(event.data.tickCount || 0);
      }
    };

    const task: WorkerTask = { type: "stop" };
    worker.postMessage(task);
  });
}

// FIX: Actually terminate all workers
export function terminateAllWorkers(): void {
  // FIX: Iterate and terminate each worker
  while (activeWorkers.length > 0) {
    const worker = activeWorkers.pop();
    if (worker) {
      worker.terminate();
    }
  }
}

// FIX: Function to run a quick task with proper cleanup
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
        const tickCount = event.data.tickCount;
        // FIX: Terminate the worker when done
        worker.terminate();
        removeFromActiveWorkers(worker);
        resolve(tickCount);
      }
    };

    worker.postMessage({ type: "start-monitoring", interval: 10 });
  });
}

// FIX: Create a managed worker with automatic cleanup
export class ManagedWorker {
  private worker: Worker;
  private isTerminated: boolean = false;

  constructor() {
    this.worker = createMonitoringWorker();
  }

  async startMonitoring(intervalMs: number = 100): Promise<void> {
    if (this.isTerminated) {
      throw new Error("Worker has been terminated");
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent<MonitoringResult>) => {
        if (event.data.type === "monitoring-started") {
          this.worker.removeEventListener("message", handler);
          resolve();
        }
      };
      this.worker.addEventListener("message", handler);
      this.worker.postMessage({ type: "start-monitoring", interval: intervalMs });
    });
  }

  async getStatus(): Promise<WorkerStatus> {
    if (this.isTerminated) {
      throw new Error("Worker has been terminated");
    }
    return getWorkerStatus(this.worker);
  }

  terminate(): void {
    if (!this.isTerminated) {
      this.worker.terminate();
      removeFromActiveWorkers(this.worker);
      this.isTerminated = true;
    }
  }
}
