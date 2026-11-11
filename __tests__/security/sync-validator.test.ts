// __tests__/security/sync-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateSyncPayload, SyncPayloadValidationError } from "@/lib/security/sync-validator";

describe("validateSyncPayload", () => {
  it("keeps the date a status was chosen and drops anything that is not text", () => {
    const { games } = validateSyncPayload({
      games: [
        { appId: 1, platform: "steam", name: "Dated", status: "backlog", statusChangedAt: "2026-11-01T10:00:00.000Z" },
        { appId: 2, platform: "steam", name: "Odd", status: "backlog", statusChangedAt: 1730455200000 },
      ],
    });

    expect(games.map((g) => g.statusChangedAt)).toEqual(["2026-11-01T10:00:00.000Z", undefined]);
  });

  it("keeps the date a game was finished and drops anything that is not text", () => {
    const { games } = validateSyncPayload({
      games: [
        { appId: 1, platform: "steam", name: "Done", status: "completed", completedAt: "2026-04-01T10:00:00.000Z" },
        { appId: 2, platform: "steam", name: "Odd", status: "completed", completedAt: 1730455200000 },
      ],
    });

    expect(games.map((g) => g.completedAt)).toEqual(["2026-04-01T10:00:00.000Z", undefined]);
  });

  it("keeps a whole-number backlog rank and drops anything else", () => {
    const { games } = validateSyncPayload({
      games: [
        { appId: 1, platform: "steam", name: "Queued", status: "backlog", backlogRank: -2 },
        { appId: 2, platform: "steam", name: "Odd", status: "backlog", backlogRank: "first" },
        { appId: 3, platform: "steam", name: "Fraction", status: "backlog", backlogRank: 1.5 },
      ],
    });

    expect(games.map((g) => g.backlogRank)).toEqual([-2, undefined, undefined]);
  });

  it("sanitizes valid games, collections, progress, and strips unsafe headerImg URLs", () => {
    const result = validateSyncPayload({
      games: [
        null,
        { appId: -1, platform: "steam", name: "Invalid" },
        {
          appId: 440,
          platform: "steam",
          name: "Team Fortress 2",
          headerImg: "javascript:alert(1)",
          totalAchievements: 500,
          unlockedCount: 10,
          playtimeHours: 12.5,
          lastPlayed: "2026-01-01",
        },
      ],
      favorites: [440, -5, "invalid"],
      wishlist: [440, 0],
      collections: [
        null,
        { name: "" },
        { name: "Favorites", description: "Best", color: "#fff", icon: "star", gameIds: [440, -1] },
      ],
      progress: {
        steam_440: { unlockedIds: ["ACH_1", 123], notes: { ACH_1: "easy" } },
        invalid_entry: null,
      },
      steamApiKey: "  MY_STEAM_KEY  ",
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0].headerImg).toBe("");
    expect(result.favorites).toEqual([440]);
    expect(result.wishlist).toEqual([440]);
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].gameIds).toEqual([440]);
    expect(result.progress.steam_440.unlockedIds).toEqual(["ACH_1"]);
    expect(result.steamApiKey).toBe("MY_STEAM_KEY");
  });

  it("throws SyncPayloadValidationError when games or progress batch exceeds limit", () => {
    const oversizedGames = Array.from({ length: 2005 }, (_, i) => ({
      appId: i + 1,
      platform: "steam",
      name: `Game ${i}`,
    }));
    expect(() => validateSyncPayload({ games: oversizedGames })).toThrow(SyncPayloadValidationError);

    const oversizedProgress: Record<string, unknown> = {};
    for (let i = 0; i < 2005; i++) {
      oversizedProgress[`steam_${i}`] = { unlockedIds: [] };
    }
    expect(() => validateSyncPayload({ progress: oversizedProgress })).toThrow(SyncPayloadValidationError);
  });
});
