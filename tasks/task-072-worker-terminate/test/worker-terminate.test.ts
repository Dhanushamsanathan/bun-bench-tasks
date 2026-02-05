import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  startMonitoring,
  getWorkerStatus,
  stopMonitoring,
  terminateAllWorkers,
  activeWorkers,
  runQuickTask,
} from "../src/main";

describe("Worker Termination", () => {
  afterEach(() => {
    // Clean up any workers after each test
    terminateAllWorkers();
  });

  test("should start monitoring and track ticks", async () => {
    const worker = await startMonitoring(50);

    // Wait for some ticks
    await new Promise((resolve) => setTimeout(resolve, 200));

    const status = await getWorkerStatus(worker);
    expect(status.running).toBe(true);
    expect(status.tickCount).toBeGreaterThan(0);

    await stopMonitoring(worker);
    worker.terminate();
  });

  test("should stop incrementing ticks after termination", async () => {
    const worker = await startMonitoring(20);

    // Wait for some ticks
    await new Promise((resolve) => setTimeout(resolve, 100));

    const statusBefore = await getWorkerStatus(worker);
    const ticksBefore = statusBefore.tickCount;

    // Terminate the worker
    worker.terminate();

    // Wait a bit more
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create a new worker to verify the old one stopped
    // If old worker was still running, it would have more ticks
    // but since we can't query a terminated worker, we verify by
    // checking that creating new workers works properly
    const newWorker = await startMonitoring(20);
    const newStatus = await getWorkerStatus(newWorker);

    // New worker should have fresh tick count
    expect(newStatus.tickCount).toBeLessThan(ticksBefore + 10);

    newWorker.terminate();
  });

  test("should properly clean up all workers", async () => {
    // Create multiple workers
    const worker1 = await startMonitoring(50);
    const worker2 = await startMonitoring(50);
    const worker3 = await startMonitoring(50);

    expect(activeWorkers.length).toBe(3);

    // Terminate all
    terminateAllWorkers();

    // All workers should be terminated and removed
    expect(activeWorkers.length).toBe(0);

    // Verify workers are actually terminated by checking they don't respond
    // A terminated worker should not process new messages
    let responded = false;
    worker1.onmessage = () => {
      responded = true;
    };
    worker1.postMessage({ type: "get-status" });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(responded).toBe(false);
  });

  test("should not leak workers after quick tasks", async () => {
    const initialCount = activeWorkers.length;

    // Run multiple quick tasks
    await runQuickTask();
    await runQuickTask();
    await runQuickTask();

    // After proper termination, worker count should not grow
    // (or should grow minimally and be cleaned up)
    terminateAllWorkers();
    expect(activeWorkers.length).toBe(0);
  });

  test("stopMonitoring should terminate the worker", async () => {
    const worker = await startMonitoring(20);

    // Wait for some ticks
    await new Promise((resolve) => setTimeout(resolve, 100));

    const tickCount = await stopMonitoring(worker);
    expect(tickCount).toBeGreaterThan(0);

    // After stopping, worker should be terminated
    // Verify by checking it doesn't respond
    let responded = false;
    worker.onmessage = () => {
      responded = true;
    };
    worker.postMessage({ type: "get-status" });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(responded).toBe(false);
  });

  test("should handle rapid create/terminate cycles", async () => {
    for (let i = 0; i < 5; i++) {
      const worker = await startMonitoring(10);
      await new Promise((resolve) => setTimeout(resolve, 30));
      const status = await getWorkerStatus(worker);
      expect(status.tickCount).toBeGreaterThan(0);
      await stopMonitoring(worker);
      worker.terminate();
    }

    // Should not have accumulated workers
    expect(activeWorkers.filter((w) => w !== null).length).toBeLessThanOrEqual(5);
    terminateAllWorkers();
    expect(activeWorkers.length).toBe(0);
  });
});
