import { collectLiveSources } from "./collect";

const SCHEDULER_INTERVAL_MS = 30 * 60 * 1_000;
type GlobalScheduler = typeof globalThis & { __010000LocalScheduler?: ReturnType<typeof setInterval> };

export function startLocalScheduler(): void {
  const state = globalThis as GlobalScheduler;
  if (state.__010000LocalScheduler) return;
  void collectLiveSources().catch((error) => console.error("[scheduler] initial collection failed", error));
  const timer = setInterval(() => {
    void collectLiveSources().catch((error) => console.error("[scheduler] collection failed", error));
  }, SCHEDULER_INTERVAL_MS);
  timer.unref();
  state.__010000LocalScheduler = timer;
}
