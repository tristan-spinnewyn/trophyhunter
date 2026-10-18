// __tests__/lib/gog/game-details.services.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initDatabase,
  setDbForTesting,
  createUser,
  saveUserPlatformAccount,
  getUserGameProgress,
} from "@/lib/db";
import {
  fetchGogTokenGames,
  getGogAchievementsForUser,
} from "@/lib/gog/game-details.services";
import { jsonResponse, textResponse } from "../../helpers/responses";

describe("GOG game details service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("fetches and persists user GOG achievements for a game", async () => {
    const user = createUser("GogPlayer", "password123");
    saveUserPlatformAccount(user.id, {
      platform: "gog",
      username: "shinkuma13",
      displayName: "shinkuma13",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 1, totalAchievements: 0, completedGames: 0 },
    });

    const mockHtml = `
      <script>
        window.profilesData.profileUser = {"userId":"50793782277245151"};
        window.profilesData.achievements = [{"achievement":{"id":"51180581499225074","name":"Spartan 2033","description":"Complete the game","imageUrlUnlocked":"https://images.gog.com/ach.jpg","rarity":10.1,"visible":true},"stats":{"50793782277245151":{"isUnlocked":true}}}];
      </script>
    `;
    vi.spyOn(global, "fetch").mockResolvedValueOnce(textResponse(mockHtml));

    const achievements = await getGogAchievementsForUser(user.id, 1436434037);
    expect(achievements).toHaveLength(1);
    expect(achievements?.[0]?.name).toBe("Spartan 2033");

    const progress = getUserGameProgress(user.id, 1436434037, "gog");
    expect(progress?.unlockedIds).toEqual(["51180581499225074"]);
  });

  it("returns empty array when token games request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "unauthorized" }, 401)
    );
    const games = await fetchGogTokenGames({}, "2026-10-18T10:00:00.000Z");
    expect(games).toEqual([]);
  });
});
