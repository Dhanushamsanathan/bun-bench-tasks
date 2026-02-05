/**
 * Worker code with background monitoring task - FIXED
 * Solution: Properly clear intervals and handle termination
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

function tick() {
  if (!isRunning) {
    // FIX: Don't process if not running
    return;
  }
  tickCount++;
  // Simulate some background work
  const data = new Array(1000).fill(0).map((_, i) => i * tickCount);
}

// FIX: Cleanup function to properly stop all background tasks
function cleanup() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}

self.onmessage = (event: MessageEvent<WorkerTask>) => {
  const task = event.data;

  if (task.type === "start-monitoring") {
    // FIX: Clean up any existing interval before starting new one
    cleanup();

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
    // FIX: Properly clear the interval
    cleanup();

    const result: MonitoringResult = {
      type: "monitoring-stopped",
      tickCount,
    };
    self.postMessage(result);
  }
};

// FIX: Handle worker termination cleanup
// Note: In Bun/browsers, when terminate() is called, the worker stops immediately
// but this event handler can help with graceful shutdown if close() is used
self.onclose = () => {
  cleanup();
};

// FIX: Handle any errors by cleaning up
self.onerror = () => {
  cleanup();
};
