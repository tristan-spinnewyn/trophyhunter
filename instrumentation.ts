// instrumentation.ts

/**
 * Runs once when the Next.js server starts. The app is a single long-running Node process,
 * so its background jobs (automatic platform sync, wishlist prices) are scheduled here;
 * AUTO_SYNC_ENABLED=false turns them off.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.AUTO_SYNC_ENABLED === "false") return;
  const { startAutoSyncScheduler } = await import("@/lib/accounts/auto-sync-scheduler");
  const { runScheduledJobs } = await import("@/lib/scheduler/scheduled-jobs");
  startAutoSyncScheduler(runScheduledJobs);
}
