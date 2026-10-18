// __tests__/lib/dashboard/navTabsConfig.services.test.ts

import { describe, it, expect } from "vitest";
import {
  buildPlatformTabItems,
  buildFeatureTabItems,
} from "@/components/dashboard/nav/navTabsConfig.services";
import type { UserAccountProfile } from "@/lib/types";

describe("navTabsConfig.services", () => {
  const mockProfile: UserAccountProfile = {
    displayName: "PlayerOne",
    accounts: {
      steam: {
        platform: "steam",
        username: "player1",
        displayName: "PlayerOne",
        connectedAt: "2026-01-01",
        stats: {
          gamesOwned: 120,
          totalAchievements: 500,
          completedGames: 10,
        },
      },
      xbox: undefined,
    },
  };

  it("builds platform tab items with accurate counts, active state, and connection status", () => {
    const items = buildPlatformTabItems(
      "steam",
      { steam: 227, xbox: 18, epic: 0, gog: -5 },
      mockProfile
    );

    expect(items).toHaveLength(4);

    const steamTab = items.find((i) => i.id === "steam");
    expect(steamTab?.isActive).toBe(true);
    expect(steamTab?.isConnected).toBe(true);
    expect(steamTab?.count).toBe(227);
    expect(steamTab?.label).toBe("Steam");

    const xboxTab = items.find((i) => i.id === "xbox");
    expect(xboxTab?.isActive).toBe(false);
    expect(xboxTab?.isConnected).toBe(false);
    expect(xboxTab?.count).toBe(18);

    const gogTab = items.find((i) => i.id === "gog");
    expect(gogTab?.count).toBe(0);
  });

  it("handles missing or empty account profiles and negative feature counts gracefully", () => {
    const emptyProfile: UserAccountProfile = {
      displayName: "Empty",
      accounts: {},
    };

    const platformItems = buildPlatformTabItems("all", {}, emptyProfile);
    expect(platformItems.every((i) => !i.isActive && !i.isConnected && i.count === 0)).toBe(
      true
    );

    const featureItems = buildFeatureTabItems("duplicates", {
      duplicateCount: 28,
      wishlistCount: -3,
      collectionsCount: 4,
    });

    expect(featureItems).toHaveLength(4);
    expect(featureItems.find((f) => f.id === "duplicates")?.isActive).toBe(true);
    expect(featureItems.find((f) => f.id === "duplicates")?.count).toBe(28);
    expect(featureItems.find((f) => f.id === "wishlist")?.count).toBe(0);
    expect(featureItems.find((f) => f.id === "collections")?.count).toBe(4);
    expect(featureItems.find((f) => f.id === "gamepass")?.count).toBeUndefined();
  });
});
