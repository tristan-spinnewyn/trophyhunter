// __tests__/lib/platform-account-form.test.ts
import { describe, it, expect } from "vitest";
import { buildAccountFromForm, createFormFromAccount, INITIAL_PLATFORM_FORM } from "@/lib/platform-account-form";
import type { PlatformAccount } from "@/lib/types";

const account: PlatformAccount = {
  platform: "epic",
  username: "player1",
  displayName: "Player One",
  level: 12,
  connectedAt: "2026-01-01T00:00:00.000Z",
  stats: {
    gamesOwned: 40, totalAchievements: 300, completedGames: 5, hoursPlayed: 120.5, gamerScore: 9000,
    trophies: { platinum: 2, gold: 10, silver: 20, bronze: 30 },
  },
};

describe("createFormFromAccount", () => {
  it("starts empty without an account", () => {
    expect(createFormFromAccount()).toEqual(INITIAL_PLATFORM_FORM);
  });

  it("fills every field from an existing account as text", () => {
    expect(createFormFromAccount(account)).toEqual({
      username: "player1", displayName: "Player One", level: "12", gamesOwned: "40",
      totalAchievements: "300", completedGames: "5", hoursPlayed: "120.5", gamerScore: "9000",
      platinum: "2", gold: "10", silver: "20", bronze: "30",
    });
  });
});

describe("buildAccountFromForm", () => {
  it("parses numbers, keeps the original connection date and records trophies for Epic", () => {
    const built = buildAccountFromForm("epic", createFormFromAccount(account), account);

    expect(built).toMatchObject({
      platform: "epic", username: "player1", displayName: "Player One", level: 12,
      connectedAt: "2026-01-01T00:00:00.000Z",
      stats: {
        gamesOwned: 40, totalAchievements: 300, completedGames: 5, hoursPlayed: 120.5, gamerScore: 9000,
        trophies: { platinum: 2, gold: 10, silver: 20, bronze: 30 },
      },
    });
  });

  it("derives totals from trophies when left empty and falls back to the username", () => {
    const built = buildAccountFromForm("steam", {
      ...INITIAL_PLATFORM_FORM, username: "  solo  ", platinum: "3", gold: "4", silver: "", bronze: "1",
    });

    expect(built.displayName).toBe("solo");
    expect(built.stats).toMatchObject({ gamesOwned: 0, totalAchievements: 8, completedGames: 3, trophies: undefined });
    expect(built.level).toBeUndefined();
  });
});
