// __tests__/storage/account.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getSavedSteamUser,
  saveSteamUser,
  getSavedSteamApiKey,
  saveSteamApiKey,
  getUserAccount,
  saveUserAccount,
  savePlatformAccount,
  removePlatformAccount,
} from "@/lib/storage";
import type { PlatformAccount, UserAccountProfile } from "@/lib/types";

describe("Storage Account & Platforms", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles steam user saving and clearing", () => {
    expect(getSavedSteamUser()).toBe("");
    saveSteamUser("custom_user");
    expect(getSavedSteamUser()).toBe("custom_user");
    saveSteamUser("  ");
    expect(getSavedSteamUser()).toBe("");
  });

  it("handles steam api key with encryption and legacy plaintext", () => {
    expect(getSavedSteamApiKey()).toBe("");
    saveSteamApiKey("ABC123XYZ456");
    const rawStored = localStorage.getItem("trophyhunter_steam_api_key");
    expect(rawStored).toMatch(/^enc_v1:/);
    expect(getSavedSteamApiKey()).toBe("ABC123XYZ456");
    saveSteamApiKey("  ");
    expect(getSavedSteamApiKey()).toBe("");

    localStorage.setItem("trophyhunter_steam_api_key", "LEGACY_PLAIN_KEY_999");
    expect(getSavedSteamApiKey()).toBe("LEGACY_PLAIN_KEY_999");
  });

  it("manages user account profile and platform connections", () => {
    const account = getUserAccount();
    expect(account.displayName).toBe("Chasseur de Trophées");

    const profile: UserAccountProfile = {
      displayName: "Test Hunter",
      accounts: {
        steam: {
          platform: "steam",
          username: "76561199999999999",
          displayName: "SteamHunter",
          connectedAt: new Date().toISOString(),
          stats: { gamesOwned: 10, totalAchievements: 50, completedGames: 2 },
        },
      },
    };
    saveUserAccount(profile);
    expect(getUserAccount().displayName).toBe("Test Hunter");
    expect(getSavedSteamUser()).toBe("76561199999999999");

    const xboxAccount: PlatformAccount = {
      platform: "xbox",
      username: "xbox_gamer",
      displayName: "Xbox Gamer",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 5, totalAchievements: 10, completedGames: 1 },
    };
    savePlatformAccount(xboxAccount);
    expect(getUserAccount().accounts.xbox?.username).toBe("xbox_gamer");

    removePlatformAccount("xbox");
    expect(getUserAccount().accounts.xbox).toBeUndefined();

    removePlatformAccount("steam");
    expect(getSavedSteamUser()).toBe("");
  });
});
