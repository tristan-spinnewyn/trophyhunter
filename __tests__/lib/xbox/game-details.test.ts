// __tests__/lib/xbox/game-details.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserPlatformAccount,
  saveUserOwnedGames,
  getUserGameProgress,
} from "@/lib/db";
import {
  fetchXboxTitleAchievements,
  enrichXboxGamesTotals,
  getXboxAchievementsForUser,
} from "@/lib/xbox/game-details";
import { jsonResponse } from "../../helpers/responses";

describe("lib/xbox/game-details", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("fetches title achievements and totalCount from OpenXBL pagingInfo", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        content: {
          achievements: [{ id: "1", name: "First Step", progressState: "Achieved" }],
          pagingInfo: { totalRecords: 82 },
        },
        code: 200,
      })
    );

    const res = await fetchXboxTitleAchievements("2533274798129181", 1715559203, {
      "X-Authorization": "key",
    });
    expect(res.totalCount).toBe(82);
    expect(res.items).toHaveLength(1);
  });

  it("enriches Xbox games via OpenXBL or falls back to Steam store schema", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1716740, name: "Starfield" }] }))
      .mockResolvedValueOnce(jsonResponse({ "1716740": { data: { name: "Starfield" } } }))
      .mockResolvedValueOnce(
        jsonResponse({
          response: { achievements: Array.from({ length: 82 }, (_, i) => ({ internal_name: `a${i}` })) },
        })
      );

    const games = [
      {
        appId: 1715559203,
        name: "Starfield",
        headerImg: "",
        platform: "xbox" as const,
        totalAchievements: 0,
        unlockedCount: 1,
        addedAt: "2026-10-18T00:00:00.000Z",
      },
    ];
    const rawTitles = [
      {
        titleId: "1715559203",
        name: "Starfield",
        achievement: { currentAchievements: 1, totalAchievements: 0 },
      },
    ];

    await enrichXboxGamesTotals(games, rawTitles, "2533274798129181", { "X-Authorization": "k" });
    expect(games[0].totalAchievements).toBe(82);
  });

  it("resolves user Xbox achievements, matches fallback list, and persists unlockedIds", async () => {
    const user = createUser("XboxDetailUser", "pass1234");
    saveUserPlatformAccount(
      user.id,
      {
        platform: "xbox",
        username: "2533274798129181",
        displayName: "Spartan",
        connectedAt: new Date().toISOString(),
        stats: { gamesOwned: 1, totalAchievements: 1, completedGames: 0 },
      },
      "XBL_SECRET_KEY"
    );
    saveUserOwnedGames(user.id, [
      {
        appId: 1715559203,
        name: "Starfield",
        headerImg: "",
        platform: "xbox",
        totalAchievements: 1,
        unlockedCount: 1,
        addedAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        content: {
          achievements: [
            { id: "10", name: "Pour tous, dans le cosmos étoilé", progressState: "Achieved", rarity: { currentPercentage: 88.7 } },
          ],
          pagingInfo: { totalRecords: 1 },
        },
      })
    );

    const fallbackList = [
      { id: "s1", name: "Pour tous, dans le cosmos étoilé", desc: "Space", icon: "", percent: 88.7, hidden: false, missable: false },
      { id: "s2", name: "Un petit pas", desc: "Constellation", icon: "", percent: 78.9, hidden: false, missable: false },
    ];

    const res = await getXboxAchievementsForUser(user.id, 1715559203, fallbackList);
    expect(res).not.toBeNull();
    expect(res?.achievements).toHaveLength(2);
    expect(res?.unlockedIds).toEqual(["s1"]);
    const saved = getUserGameProgress(user.id, 1715559203, "xbox");
    expect(saved?.unlockedIds).toEqual(["s1"]);
  });
});
