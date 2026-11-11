// lib/scheduler/scheduled-jobs.ts
import { runDueSyncs } from "@/lib/accounts/auto-sync-scheduler";
import { checkWishlistPrices } from "@/lib/wishlist/price-check-job";
import { writeWeeklyBackups } from "@/lib/backup/weekly-backup-job";
import { refreshWishlistReleaseDates } from "@/lib/wishlist/release-date-job";

/** A background job run on each scheduler tick; returns how many items it handled. */
export type ScheduledJob = (now: Date) => Promise<number>;

/** The jobs the server runs on its own: due platform syncs, stale wishlist prices, wishlist release dates, then weekly backups. */
export const DEFAULT_SCHEDULED_JOBS: readonly ScheduledJob[] = [runDueSyncs, checkWishlistPrices, refreshWishlistReleaseDates, writeWeeklyBackups];

/** Runs every job one after the other; a failing job is logged and does not stop the next ones. */
export async function runScheduledJobs(now: Date, jobs: readonly ScheduledJob[] = DEFAULT_SCHEDULED_JOBS): Promise<number> {
  let handled = 0;
  for (const job of jobs) {
    try {
      handled += await job(now);
    } catch (error) {
      console.error("Scheduled job failed:", error);
    }
  }
  return handled;
}
