/**
 * Worker code with background monitoring task
 * BUG: Does not properly clean up when terminated
 */

declare var self: Worker;

interface WorkerTask {
  type: "start-monitoring" | "get-status" | "stop";
  interval?: number;
}

interface WorkerStatus {
  type: "status";
  running: boolean;
  tickCount: number;
  startedAt: string;
}

interface MonitoringResult {
  type: "monitoring-started" | "monitoring-stopped";
  tickCount?: number;
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;
let isRunning = false;
let startedAt: Date | null = null;

// BUG: This counter keeps incrementing even after "stop" message
// because the interval is not properly cleared
function tick() {
  tickCount++;
  // Simulate some background work
  const data = new Array(1000).fill(0).map((_, i) => i * tickCount);
}

self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const task = event.data;

  if (task.type === "start-monitoring") {
    const interval = task.interval || 100;
    tickCount = 0;
    isRunning = true;
    startedAt = new Date();

    // Start the monitoring interval
    intervalId = setInterval(tick, interval);

    const result: MonitoringResult = { type: "monitoring-started" };
    self.postMessage(result);
  } else if (task.type === "get-status") {
    const status: WorkerStatus = {
      type: "status",
      running: isRunning,
      tickCount,
      startedAt: startedAt?.toISOString() || "",
    };
    self.postMessage(status);
  } else if (task.type === "stop") {
    // BUG: Only sets flag but doesn't clear the interval
    isRunning = false;
    // BUG: Missing clearInterval(intervalId)

    const result: MonitoringResult = {
      type: "monitoring-stopped",
      tickCount,
    };
    self.postMessage(result);
  }
};

// BUG: No cleanup when worker is terminated
// The interval will continue running
