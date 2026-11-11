// __tests__/db/user-settings.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  getUserSettings,
  saveUserSettings,
  markAutoSyncRun,
  listUsersDueForAutoSync,
  DEFAULT_USER_SETTINGS,
} from "@/lib/db";

describe("user settings", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("SettingsUser", "password123").id;
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("starts from the defaults: no automatic sync, stale after six weeks", () => {
    expect(getUserSettings(userId)).toEqual(DEFAULT_USER_SETTINGS);
    expect(DEFAULT_USER_SETTINGS).toEqual({ autoSyncHours: null, staleAfterWeeks: 6 });
  });

  it("saves part of the settings and keeps the rest", () => {
    saveUserSettings(userId, { autoSyncHours: 12 });
    saveUserSettings(userId, { staleAfterWeeks: 4 });

    expect(getUserSettings(userId)).toEqual({ autoSyncHours: 12, staleAfterWeeks: 4 });
  });

  it("turns the automatic sync off again", () => {
    saveUserSettings(userId, { autoSyncHours: 12 });
    saveUserSettings(userId, { autoSyncHours: null });

    expect(getUserSettings(userId).autoSyncHours).toBeNull();
  });

  it("lists users whose automatic sync is due", () => {
    const now = new Date("2026-11-11T12:00:00.000Z");
    const neverRun = createUser("NeverRun", "password123").id;
    const recent = createUser("Recent", "password123").id;
    const old = createUser("Old", "password123").id;
    saveUserSettings(neverRun, { autoSyncHours: 6 });
    saveUserSettings(recent, { autoSyncHours: 6 });
    saveUserSettings(old, { autoSyncHours: 6 });
    markAutoSyncRun(recent, new Date("2026-11-11T10:00:00.000Z"));
    markAutoSyncRun(old, new Date("2026-11-11T05:00:00.000Z"));

    expect(listUsersDueForAutoSync(now).sort()).toEqual([neverRun, old].sort());
  });
});
