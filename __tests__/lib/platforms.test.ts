// __tests__/lib/platforms.test.ts
import { describe, it, expect } from "vitest";
import type { UserAccountProfile } from "@/lib/types";
import { countConnectedPlatforms } from "@/lib/platforms";

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
