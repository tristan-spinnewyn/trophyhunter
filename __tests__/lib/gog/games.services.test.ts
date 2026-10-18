// __tests__/lib/gog/games.services.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGogPublicGames } from "@/lib/gog/games.services";
import { jsonResponse, textResponse } from "../../helpers/responses";

describe("GOG public games service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches public games stats and enriches active games with achievements", async () => {
    const statsPayload = {
      page: 1,
      pages: 1,
      total: 2,
      _embedded: {
        items: [
          {
            game: {
              id: "1436434037",
              title: "Metro 2033 Redux",
              achievementSupport: true,
              image: "https://images.gog-statics.com/metro.png",
            },
            stats: {
              "50793782277245151": {
                achievementsPercentage: 30,
                playtime: 490,
                lastSession: "2021-03-29T00:05:23+00:00",
              },
            },
          },
          {
            game: {
              id: "1207658924",
              title: "The Witcher",
              achievementSupport: false,
              image: "https://images.gog-statics.com/witcher.png",
            },
            stats: [],
          },
        ],
      },
    };

    const gameAchHtml = `
      <script>
        window.profilesData.achievements = [{"achievement":{"id":"a1","name":"Tonic Man","description":"Use Medkit","imageUrlUnlocked":"https://images.gog.com/a1.jpg","rarity":18.1,"visible":true},"stats":{"50793782277245151":{"isUnlocked":true}}},{"achievement":{"id":"a2","name":"Ranger","description":"Ranger mode","imageUrlUnlocked":"https://images.gog.com/a2.jpg","rarity":5.0,"visible":true},"stats":[]}];
      </script>
    `;

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(statsPayload))
      .mockResolvedValueOnce(textResponse(gameAchHtml));

    const res = await fetchGogPublicGames(
      "shinkuma13",
      "50793782277245151",
      {},
      "2026-10-18T10:00:00.000Z"
    );

    expect(res.games).toHaveLength(2);
    expect(res.games[0]?.name).toBe("Metro 2033 Redux");
    expect(res.games[0]?.totalAchievements).toBe(2);
    expect(res.games[0]?.unlockedCount).toBe(1);
    expect(res.games[0]?.playtimeHours).toBe(8.2);
    expect(res.gameProgress[1436434037]).toEqual(["a1"]);
  });

  it("uses fallback recentGames when games/stats request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const res = await fetchGogPublicGames(
      "shinkuma13",
      "50793782277245151",
      {},
      "2026-10-18T10:00:00.000Z",
      [
        {
          game: { id: "1436434037", title: "Metro 2033 Redux" },
          stats: { "50793782277245151": { achievementsPercentage: 100 } },
        },
      ]
    );

    expect(res.games).toHaveLength(1);
    expect(res.completedGamesCount).toBe(1);
  });
});
