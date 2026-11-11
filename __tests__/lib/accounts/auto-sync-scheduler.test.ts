// __tests__/lib/accounts/auto-sync-scheduler.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initDatabase, setDbForTesting, createUser, saveUserSettings, listUsersDueForAutoSync } from "@/lib/db";
import { AUTO_SYNC_TICK_MS, runDueSyncs, startAutoSyncScheduler } from "@/lib/accounts/auto-sync-scheduler";

describe("automatic sync scheduler", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    vi.useRealTimers();
    setDbForTesting(null);
  });

  it("syncs the users that are due and marks their run", async () => {
    const due = createUser("Due", "password123").id;
    createUser("Off", "password123");
    saveUserSettings(due, { autoSyncHours: 6 });
    const sync = vi.fn().mockResolvedValue([]);
    const now = new Date("2026-11-11T12:00:00.000Z");

    expect(await runDueSyncs(now, sync)).toBe(1);

    expect(sync).toHaveBeenCalledWith(due);
    expect(listUsersDueForAutoSync(now)).toEqual([]);
  });

  it("marks a run even when the sync throws, so a broken account is not retried every tick", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const due = createUser("Broken", "password123").id;
    saveUserSettings(due, { autoSyncHours: 6 });
    const now = new Date("2026-11-11T12:00:00.000Z");

    await runDueSyncs(now, vi.fn().mockRejectedValue(new Error("boom")));

    expect(listUsersDueForAutoSync(now)).toEqual([]);
  });

  it("checks on every tick and never runs two passes at once", async () => {
    vi.useFakeTimers();
    let release: () => void = () => {};
    const run = vi.fn(() => new Promise<number>((resolve) => { release = () => resolve(0); }));

    const stop = startAutoSyncScheduler(run);
    await vi.advanceTimersByTimeAsync(AUTO_SYNC_TICK_MS);
    await vi.advanceTimersByTimeAsync(AUTO_SYNC_TICK_MS);
    expect(run).toHaveBeenCalledTimes(1);

    release();
    await vi.advanceTimersByTimeAsync(AUTO_SYNC_TICK_MS);
    expect(run).toHaveBeenCalledTimes(2);

    stop();
    release();
    await vi.advanceTimersByTimeAsync(AUTO_SYNC_TICK_MS * 3);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("survives a failing pass", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockRejectedValueOnce(new Error("db locked")).mockResolvedValue(0);

    const stop = startAutoSyncScheduler(run);
    await vi.advanceTimersByTimeAsync(AUTO_SYNC_TICK_MS * 2);

    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });
});
