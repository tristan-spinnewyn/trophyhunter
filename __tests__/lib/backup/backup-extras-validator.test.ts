// __tests__/lib/backup/backup-extras-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateBackupExtras } from "@/lib/backup/backup-extras-validator";
import { isBackupFile } from "@/lib/backup/backup-format";

describe("validateBackupExtras", () => {
  it("keeps valid sessions, settings, goals and wishlist games", () => {
    const extras = validateBackupExtras({
      sessions: [{ appId: 3, platform: "gog", minutes: 90, detectedAt: "2027-01-01T20:00:00.000Z", lastPlayed: "2027-01-01T19:00:00.000Z" }],
      settings: { autoSyncHours: 24, staleAfterWeeks: 4 },
      goals: [{ year: 2027, kind: "hours-played", target: 100, baseline: null }],
      wishlist: [{ appId: 99, platform: "steam", name: " Silksong ", headerImg: "https://example.test/s.jpg", targetPriceCents: 1999 }],
    });

    expect(extras).toEqual({
      sessions: [{ appId: 3, platform: "gog", minutes: 90, detectedAt: "2027-01-01T20:00:00.000Z", lastPlayed: "2027-01-01T19:00:00.000Z" }],
      settings: { autoSyncHours: 24, staleAfterWeeks: 4 },
      goals: [{ year: 2027, kind: "hours-played", target: 100, baseline: null }],
      wishlist: [{ appId: 99, platform: "steam", name: "Silksong", headerImg: "https://example.test/s.jpg", targetPriceCents: 1999 }],
    });
  });

  it("drops malformed entries and falls back to the default settings", () => {
    const extras = validateBackupExtras({
      sessions: [{ appId: 3, platform: "gog", minutes: -5, detectedAt: "2027-01-01" }, { appId: 3, platform: "gog", minutes: 5, detectedAt: "hier" }, "x"],
      settings: { autoSyncHours: 7 },
      goals: [{ year: 2027, kind: "speedrun", target: 1 }, { year: 2027, kind: "games-finished", target: 0 }],
      wishlist: [{ appId: 99, platform: "steam", name: "" }, { appId: 0, platform: "steam", name: "Zero" }, { appId: 5, platform: "steam", name: "Bad", headerImg: "javascript:alert(1)", targetPriceCents: -1 }],
    });

    expect(extras.sessions).toEqual([]);
    expect(extras.settings).toEqual({ autoSyncHours: null, staleAfterWeeks: 6 });
    expect(extras.goals).toEqual([]);
    expect(extras.wishlist).toEqual([{ appId: 5, platform: "steam", name: "Bad", headerImg: undefined, targetPriceCents: undefined }]);
  });

  it("copes with a backup missing every extra part", () => {
    expect(validateBackupExtras({})).toEqual({ sessions: [], settings: { autoSyncHours: null, staleAfterWeeks: 6 }, goals: [], wishlist: [] });
  });
});

describe("isBackupFile", () => {
  it("recognises a full backup and nothing else", () => {
    expect(isBackupFile({ format: "trophyhunter-backup", version: 2 })).toBe(true);
    expect(isBackupFile({ format: "trophyhunter-backup", version: 3 })).toBe(false);
    expect(isBackupFile({ games: [] })).toBe(false);
    expect(isBackupFile(null)).toBe(false);
  });
});
