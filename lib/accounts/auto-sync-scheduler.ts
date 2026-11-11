// lib/accounts/auto-sync-scheduler.ts
import { listUsersDueForAutoSync, markAutoSyncRun } from "@/lib/db";
import { syncUserPlatforms } from "./server-sync";

/** How often the server looks for users whose automatic sync is due. */
export const AUTO_SYNC_TICK_MS = 15 * 60 * 1000;

/**
 * Syncs every user whose automatic sync is due, one after the other, and returns how many.
 * The run is marked before syncing, so an account that keeps failing waits for its next interval.
 */
export async function runDueSyncs(now: Date, sync: (userId: string) => Promise<unknown> = syncUserPlatforms): Promise<number> {
  const due = listUsersDueForAutoSync(now);
  for (const userId of due) {
    markAutoSyncRun(userId, now);
    try {
      await sync(userId);
    } catch (error) {
      console.error("Automatic sync failed:", error);
    }
  }
  return due.length;
}

/** Checks for due syncs on every tick, skipping a tick while the previous pass is still running. Returns a stop function. */
export function startAutoSyncScheduler(run: (now: Date) => Promise<number> = runDueSyncs): () => void {
  let isRunning = false;
  const timer = setInterval(() => {
    if (isRunning) return;
    isRunning = true;
    run(new Date())
      .catch((error) => console.error("Automatic sync pass failed:", error))
      .finally(() => {
        isRunning = false;
      });
  }, AUTO_SYNC_TICK_MS);
  return () => clearInterval(timer);
}
