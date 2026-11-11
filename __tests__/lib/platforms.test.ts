// __tests__/lib/platforms.test.ts
import { describe, it, expect } from "vitest";
import type { UserAccountProfile } from "@/lib/types";
import { ALL_PLATFORMS, CONNECTABLE_PLATFORMS, MANUAL_PLATFORMS, PLATFORM_META, countConnectedPlatforms, isManualPlatform } from "@/lib/platforms";

const account = { username: "u", connectedAt: "x", stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 } };

describe("countConnectedPlatforms", () => {
  it("counts each linked platform account", () => {
    const profile = { displayName: "P", accounts: { steam: account, gog: account } } as UserAccountProfile;

    expect(countConnectedPlatforms(profile)).toBe(2);
  });

  it("is zero when nothing is linked", () => {
    expect(countConnectedPlatforms({ displayName: "P", accounts: {} })).toBe(0);
  });
});

describe("platform lists", () => {
  it("separates the platforms that connect an account from the ones tracked by hand", () => {
    expect(CONNECTABLE_PLATFORMS).toEqual(["steam", "xbox", "epic", "gog"]);
    expect(MANUAL_PLATFORMS).toEqual(["switch", "playstation", "other"]);
    expect(ALL_PLATFORMS).toEqual([...CONNECTABLE_PLATFORMS, ...MANUAL_PLATFORMS]);
  });

  it("tells a hand-tracked platform apart", () => {
    expect(isManualPlatform("switch")).toBe(true);
    expect(isManualPlatform("steam")).toBe(false);
    expect(PLATFORM_META.playstation.supportsAutoSync).toBe(false);
    expect(PLATFORM_META.other.name).toBe("Autre / physique");
  });
});
