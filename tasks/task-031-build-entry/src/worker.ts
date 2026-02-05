// Worker entry point
export function startWorker() {
  console.log("Worker started");
  return { status: "active", type: "worker" };
}

export const WORKER_ID = "worker-001";
export const MAX_TASKS = 10;

startWorker();
