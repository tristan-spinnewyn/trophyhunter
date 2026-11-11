// __tests__/lib/scheduler/scheduled-jobs.test.ts
import { describe, it, expect, vi } from "vitest";
import { runScheduledJobs } from "@/lib/scheduler/scheduled-jobs";

const NOW = new Date("2026-11-11T12:00:00.000Z");

describe("runScheduledJobs", () => {
  it("runs every job with the same time and adds up what they did", async () => {
    const sync = vi.fn().mockResolvedValue(2);
    const prices = vi.fn().mockResolvedValue(5);

    expect(await runScheduledJobs(NOW, [sync, prices])).toBe(7);
    expect(sync).toHaveBeenCalledWith(NOW);
    expect(prices).toHaveBeenCalledWith(NOW);
  });

  it("keeps going when a job fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const prices = vi.fn().mockResolvedValue(3);

    expect(await runScheduledJobs(NOW, [vi.fn().mockRejectedValue(new Error("down")), prices])).toBe(3);
    expect(prices).toHaveBeenCalled();
  });

  it("runs the automatic sync, the wishlist prices and release dates, and the weekly backups by default", async () => {
    const { runDueSyncs } = await import("@/lib/accounts/auto-sync-scheduler");
    const { checkWishlistPrices } = await import("@/lib/wishlist/price-check-job");
    const { refreshWishlistReleaseDates } = await import("@/lib/wishlist/release-date-job");
    const { writeWeeklyBackups } = await import("@/lib/backup/weekly-backup-job");
    const { DEFAULT_SCHEDULED_JOBS } = await import("@/lib/scheduler/scheduled-jobs");

    expect(DEFAULT_SCHEDULED_JOBS).toEqual([runDueSyncs, checkWishlistPrices, refreshWishlistReleaseDates, writeWeeklyBackups]);
  });
});
