// __tests__/db/play-sessions.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserOwnedGames,
  getPlaySessions,
  playtimeGrowthMinutes,
  clearAllUserData,
} from "@/lib/db";
import type { OwnedGame } from "@/lib/types";

function steamGame(appId: number, playtimeHours: number | undefined, lastPlayed?: string): OwnedGame {
  return {
    appId,
    name: `Game ${appId}`,
    headerImg: `https://example.com/${appId}.jpg`,
    platform: "steam",
    totalAchievements: 0,
    unlockedCount: 0,
    playtimeHours,
    lastPlayed,
    addedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("playtimeGrowthMinutes", () => {
  it("turns an increase of playtime into minutes", () => {
    expect(playtimeGrowthMinutes(10, 12.5)).toBe(150);
  });

  it("ignores a game seen for the first time", () => {
    expect(playtimeGrowthMinutes(null, 40)).toBeNull();
  });

  it("ignores an unknown new playtime", () => {
    expect(playtimeGrowthMinutes(10, undefined)).toBeNull();
  });

  it("ignores a playtime that did not grow or went down", () => {
    expect(playtimeGrowthMinutes(10, 10)).toBeNull();
    expect(playtimeGrowthMinutes(10, 8)).toBeNull();
  });

  it("ignores rounding noise below six minutes", () => {
    expect(playtimeGrowthMinutes(10, 10.05)).toBeNull();
    expect(playtimeGrowthMinutes(10, 10.1)).toBe(6);
  });
});

describe("play sessions journal", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("SessionUser", "password123").id;
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("records nothing when games are imported for the first time", () => {
    saveUserOwnedGames(userId, [steamGame(1, 40)]);

    expect(getPlaySessions(userId)).toEqual([]);
  });

  it("records a session when a sync brings more playtime", () => {
    saveUserOwnedGames(userId, [steamGame(1, 10)]);
    saveUserOwnedGames(userId, [steamGame(1, 12, "2026-11-10T20:00:00.000Z")]);

    const sessions = getPlaySessions(userId);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      appId: 1,
      platform: "steam",
      name: "Game 1",
      headerImg: "https://example.com/1.jpg",
      minutes: 120,
      lastPlayed: "2026-11-10T20:00:00.000Z",
    });
    expect(sessions[0].detectedAt).toEqual(expect.any(String));
  });

  it("records nothing when the same playtime is written again", () => {
    saveUserOwnedGames(userId, [steamGame(1, 10)]);
    saveUserOwnedGames(userId, [steamGame(1, 12)]);
    saveUserOwnedGames(userId, [steamGame(1, 12)]);

    expect(getPlaySessions(userId)).toHaveLength(1);
  });

  it("records nothing when a platform reports no playtime", () => {
    saveUserOwnedGames(userId, [steamGame(1, 10)]);
    saveUserOwnedGames(userId, [steamGame(1, undefined)]);

    expect(getPlaySessions(userId)).toEqual([]);
  });

  it("lists the latest sessions first and filters by date", () => {
    saveUserOwnedGames(userId, [steamGame(1, 1), steamGame(2, 1)]);
    saveUserOwnedGames(userId, [steamGame(1, 2)]);
    saveUserOwnedGames(userId, [steamGame(2, 3)]);

    const all = getPlaySessions(userId);
    expect(all.map((s) => s.appId)).toEqual([2, 1]);

    expect(getPlaySessions(userId, { since: "2999-01-01T00:00:00.000Z" })).toEqual([]);
    expect(getPlaySessions(userId, { limit: 1 })).toHaveLength(1);
  });

  it("keeps sessions per user", () => {
    const otherId = createUser("OtherUser", "password123").id;
    saveUserOwnedGames(userId, [steamGame(1, 1)]);
    saveUserOwnedGames(userId, [steamGame(1, 2)]);

    expect(getPlaySessions(otherId)).toEqual([]);
  });
});

describe("play sessions reset", () => {
  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("forgets the sessions when the user clears their data", () => {
    const userId = createUser("ResetUser", "password123").id;
    saveUserOwnedGames(userId, [steamGame(1, 1)]);
    saveUserOwnedGames(userId, [steamGame(1, 2)]);

    clearAllUserData(userId);

    expect(getPlaySessions(userId)).toEqual([]);
  });
});
