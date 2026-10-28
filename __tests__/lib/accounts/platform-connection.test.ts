// __tests__/lib/accounts/platform-connection.test.ts
import { describe, it, expect } from "vitest";
import type { PlatformAccount } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";
import {
  PLATFORM_CONNECTIONS,
  canStartSync,
  describeConnection,
  getPlatformSpecificStat,
} from "@/lib/accounts/platform-connection";

function account(overrides: Partial<PlatformAccount> = {}): PlatformAccount {
  return {
    platform: "steam",
    username: "76561198000000000",
    displayName: "Gabe",
    connectedAt: "2026-01-01T00:00:00.000Z",
    stats: { gamesOwned: 10, totalAchievements: 120, completedGames: 2 },
    ...overrides,
  };
}

describe("PLATFORM_CONNECTIONS", () => {
  it("describes how to connect every platform", () => {
    for (const platform of ALL_PLATFORMS) {
      const config = PLATFORM_CONNECTIONS[platform];
      expect(config.identifierLabel).toBeTruthy();
      expect(config.secret.label).toBeTruthy();
      expect(config.secret.helpUrl).toMatch(/^https:\/\//);
    }
  });
});

describe("describeConnection", () => {
  it("reports an unlinked platform", () => {
    expect(describeConnection(undefined)).toEqual({ isLinked: false, name: null, lastSyncLabel: null });
  });

  it("names the linked account and formats the last sync date in French", () => {
    expect(describeConnection(account({ lastSyncedAt: "2026-10-12T08:30:00.000Z" }))).toEqual({
      isLinked: true,
      name: "Gabe",
      lastSyncLabel: "Dernière synchro le 12/10/2026",
    });
  });

  it("falls back to the username and omits an unknown sync date", () => {
    expect(describeConnection(account({ displayName: "" }))).toEqual({
      isLinked: true,
      name: "76561198000000000",
      lastSyncLabel: null,
    });
  });
});

describe("canStartSync", () => {
  it("needs an identifier for Steam, Xbox and GOG", () => {
    for (const platform of ["steam", "xbox", "gog"] as const) {
      expect(canStartSync(platform, "  ", false)).toBe(false);
      expect(canStartSync(platform, "chief", false)).toBe(true);
    }
  });

  it("lets Epic sync without a username, since it can authenticate with a code", () => {
    expect(canStartSync("epic", "", false)).toBe(true);
  });

  it("never starts a second sync while one is running", () => {
    expect(canStartSync("steam", "gabe", true)).toBe(false);
    expect(canStartSync("epic", "", true)).toBe(false);
  });
});

describe("getPlatformSpecificStat", () => {
  it("shows the Xbox Gamerscore with French thousands separators", () => {
    const stat = getPlatformSpecificStat("xbox", account({ stats: { gamesOwned: 1, totalAchievements: 1, completedGames: 0, gamerScore: 12345 } }));

    expect(stat?.label).toBe("Gamerscore");
    expect(stat?.value.replace(/\s/g, " ")).toBe("12 345 G");
  });

  it("shows Steam badges and DLC", () => {
    expect(getPlatformSpecificStat("steam", account({ stats: { gamesOwned: 1, totalAchievements: 1, completedGames: 0, badges: 42, dlcCount: 7 } }))).toEqual({
      label: "Badges Steam",
      value: "42",
      hint: "7 DLC",
    });
  });

  it("has nothing to add for Epic and GOG, or without an account", () => {
    expect(getPlatformSpecificStat("epic", account())).toBeNull();
    expect(getPlatformSpecificStat("gog", account())).toBeNull();
    expect(getPlatformSpecificStat("steam", undefined)).toBeNull();
  });
});
