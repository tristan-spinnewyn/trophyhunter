// __tests__/db/sync.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  syncFromLocalStorage,
  getUserPlatformAccounts,
  getUserPlatformApiKey,
  getUserOwnedGames,
  getUserFavoriteAppIds,
  getUserGameProgress,
} from "@/lib/db";

describe("Database LocalStorage Migration", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("migrates localStorage payload into user account", () => {
    const user = createUser("MigrateUser", "password123");
    syncFromLocalStorage(user.id, {
      profile: {
        displayName: "Old Local Profile",
        accounts: {
          steam: {
            platform: "steam",
            username: "76561198000000000",
            displayName: "OldSteam",
            connectedAt: new Date().toISOString(),
            stats: {
              gamesOwned: 5,
              totalAchievements: 100,
              completedGames: 1,
            },
          },
        },
      },
      steamApiKey: "OLD_LOCAL_STEAM_API_KEY",
      games: [
        {
          appId: 1234,
          name: "Synced Local Game",
          headerImg: "",
          platform: "steam",
          totalAchievements: 10,
          unlockedCount: 2,
          addedAt: new Date().toISOString(),
        },
      ],
      progress: {
        trophyhunter_game_1234: {
          unlockedIds: ["ACH_OLD"],
          notes: { ACH_OLD: "Imported from local" },
        },
      },
      favorites: [1234],
    });

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.steam?.displayName).toBe("OldSteam");
    expect(getUserPlatformApiKey(user.id, "steam")).toBe("OLD_LOCAL_STEAM_API_KEY");

    const games = getUserOwnedGames(user.id);
    expect(games.length).toBe(1);
    expect(games[0].name).toBe("Synced Local Game");

    const favs = getUserFavoriteAppIds(user.id);
    expect(favs).toEqual([1234]);

    const prog = getUserGameProgress(user.id, 1234, "steam");
    expect(prog?.unlockedIds).toEqual(["ACH_OLD"]);
  });
});
