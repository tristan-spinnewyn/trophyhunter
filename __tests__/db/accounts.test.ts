// __tests__/db/accounts.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserPlatformAccount,
  getUserPlatformAccounts,
  getUserPlatformApiKey,
  removeUserPlatformAccount,
} from "@/lib/db";
import type { PlatformAccount } from "@/lib/types";

describe("Database Platform Accounts", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("saves and retrieves platform accounts with encrypted API keys", () => {
    const user = createUser("KeyUser", "password123");
    const account: PlatformAccount = {
      platform: "steam",
      username: "76561198000000000",
      displayName: "MySteamProfile",
      avatarUrl: "https://example.com/avatar.jpg",
      connectedAt: new Date().toISOString(),
      stats: {
        gamesOwned: 10,
        totalAchievements: 250,
        completedGames: 2,
      },
    };

    saveUserPlatformAccount(user.id, account, "SECRET_STEAM_API_KEY_123");

    const accounts = getUserPlatformAccounts(user.id);
    expect(accounts.steam).toBeDefined();
    expect(accounts.steam?.displayName).toBe("MySteamProfile");
    expect(accounts.steam?.stats.gamesOwned).toBe(10);
    expect(accounts.steam?.hasApiKey).toBe(true);
    expect(JSON.stringify(accounts)).not.toContain("SECRET_STEAM_API_KEY_123");

    const decryptedKey = getUserPlatformApiKey(user.id, "steam");
    expect(decryptedKey).toBe("SECRET_STEAM_API_KEY_123");

    removeUserPlatformAccount(user.id, "steam");
    const afterRemove = getUserPlatformAccounts(user.id);
    expect(afterRemove.steam).toBeUndefined();
    expect(getUserPlatformApiKey(user.id, "steam")).toBeNull();
  });
});
