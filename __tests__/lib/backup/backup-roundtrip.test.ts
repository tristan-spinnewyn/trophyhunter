// __tests__/lib/backup/backup-roundtrip.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getUserOwnedGames,
  getPlaySessions,
  getUserSettings,
  saveUserSettings,
  getUserGoals,
  setUserGoal,
  getUserWishlist,
  setGameWishlist,
  setWishlistTargetPrice,
  linkGames,
  saveUserGameProgress,
  getAllUserGameProgress,
  getUserPlatformAccounts,
} from "@/lib/db";
import { buildBackup } from "@/lib/backup/backup-export.services";
import { restoreBackup } from "@/lib/backup/backup-restore.services";
import { BACKUP_FORMAT, BACKUP_VERSION } from "@/lib/backup/backup-format";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const now = new Date("2027-03-01T12:00:00.000Z");

function fillCollection(userId: string) {
  saveUserOwnedGames(userId, [
    makeOwnedGame({ appId: 1, platform: "steam", name: "Hades", status: "completed", completedAt: "2027-01-10T00:00:00.000Z", rating: 5, review: "Génial." }),
    makeOwnedGame({ appId: 2, platform: "xbox", name: "Hades", status: "unsorted" }),
    makeOwnedGame({ appId: 3, platform: "gog", name: "Hollow Knight", status: "paused", resumeNote: "Cité des Larmes.", playtimeHours: 2 }),
  ]);
  // A second sync with more playtime records a play session.
  saveUserOwnedGames(userId, [makeOwnedGame({ appId: 3, platform: "gog", name: "Hollow Knight", playtimeHours: 5 })]);
  linkGames(userId, { platform: "steam", appId: 1 }, [{ platform: "xbox", appId: 2 }]);
  saveUserSettings(userId, { autoSyncHours: 12, staleAfterWeeks: 8 });
  setUserGoal(userId, { year: 2027, kind: "backlog-reduction", target: 10, baseline: 30 });
  setGameWishlist(userId, 99, "steam", true, { name: "Silksong", headerImg: "https://example.test/silksong.jpg" });
  setWishlistTargetPrice(userId, 99, 1999);
  saveUserGameProgress(userId, 1, "steam", { unlockedIds: ["ach_1"], notes: {} });
}

describe("full backup", () => {
  let owner: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    owner = createUser("BackupOwner", "password123").id;
    fillCollection(owner);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("is a versioned file without any secret", () => {
    const backup = buildBackup(owner, now);

    expect(backup).toMatchObject({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString() });
    expect(JSON.stringify(backup)).not.toMatch(/password|api_?key|token/i);
  });

  it("restores everything into an empty account", () => {
    const backup = JSON.parse(JSON.stringify(buildBackup(owner, now)));
    const restored = createUser("BackupRestored", "password123").id;

    const summary = restoreBackup(restored, backup);

    expect(summary).toEqual({ games: 3, sessions: 1, goals: 1, wishlist: 1, links: 1 });
    const strip = (userId: string) =>
      getUserOwnedGames(userId)
        .map((g) => ({ ...g, addedAt: undefined }))
        .sort((a, b) => a.appId - b.appId);
    expect(strip(restored)).toEqual(strip(owner));
    expect(getPlaySessions(restored).map(({ minutes, appId }) => ({ minutes, appId }))).toEqual([{ minutes: 180, appId: 3 }]);
    expect(getUserSettings(restored)).toEqual({ autoSyncHours: 12, staleAfterWeeks: 8 });
    expect(getUserGoals(restored)).toEqual(getUserGoals(owner));
    expect(getUserWishlist(restored)).toEqual([expect.objectContaining({ appId: 99, name: "Silksong", targetPriceCents: 1999 })]);
    expect(Object.keys(getAllUserGameProgress(restored))).toEqual(Object.keys(getAllUserGameProgress(owner)));
  });

  it("can be restored twice without doubling the play sessions", () => {
    const backup = JSON.parse(JSON.stringify(buildBackup(owner, now)));

    restoreBackup(owner, backup);

    expect(getPlaySessions(owner)).toHaveLength(1);
  });

  it("refuses a file that is not a full backup, changing nothing", () => {
    expect(() => restoreBackup(owner, { games: [] })).toThrow("Fichier de sauvegarde invalide.");
  });

  it("never restores platform accounts or keys found in a file", () => {
    const backup = {
      ...JSON.parse(JSON.stringify(buildBackup(owner, now))),
      profile: { accounts: { steam: { platform: "steam", username: "intruder", connectedAt: "2027-01-01" } } },
      steamApiKey: "secret",
    };
    const restored = createUser("NoAccounts", "password123").id;

    restoreBackup(restored, backup);

    expect(getUserPlatformAccounts(restored)).toEqual({});
  });
});
