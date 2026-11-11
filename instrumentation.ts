// instrumentation.ts

/**
 * Runs once when the Next.js server starts. The app is a single long-running Node process,
 * so the automatic platform sync lives here; AUTO_SYNC_ENABLED=false turns it off.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.AUTO_SYNC_ENABLED === "false") return;
  const { startAutoSyncScheduler } = await import("@/lib/accounts/auto-sync-scheduler");
  startAutoSyncScheduler();
}
