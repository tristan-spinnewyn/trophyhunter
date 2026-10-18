// __tests__/lib/xbox/service.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchXboxProfileLive } from "@/lib/xbox/service";
import { XboxApiError } from "@/lib/xbox/types";
import { jsonResponse } from "../../helpers/responses";

describe("lib/xbox/service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to /v2/account and /v2/titles when gamertag search returns empty", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ content: { profileUsers: [] }, code: 200 }))
      .mockResolvedValueOnce(
        jsonResponse({
          content: {
            profileUsers: [
              {
                id: "2533274798129181",
                settings: [
                  { id: "Gamertag", value: "Spartan117" },
                  { id: "Gamerscore", value: "12500" },
                ],
              },
            ],
          },
          code: 200,
        })
      )
      .mockResolvedValueOnce(jsonResponse({ error: "Not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ content: { titles: [] }, code: 200 }))
      .mockResolvedValueOnce(
        jsonResponse({
          content: {
            titles: [
              {
                titleId: "1810924247",
                name: "Forza Horizon 5",
                type: "Game",
                image: "raw-image-token",
                achievement: {
                  currentAchievements: 25,
                  totalAchievements: 50,
                  currentGamerscore: 500,
                  totalGamerscore: 1000,
                },
              },
            ],
          },
          code: 200,
        })
      );

    const res = await fetchXboxProfileLive("Spartan#117", "valid-key");
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(res.account.displayName).toBe("Spartan117");
    expect(res.account.stats.gamerScore).toBe(12500);
    expect(res.discoveredGames).toHaveLength(1);
    expect(res.discoveredGames[0].name).toBe("Forza Horizon 5");
  });

  it("returns empty discoveredGames when all title endpoints return empty", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ content: { titles: [] } }))
      .mockResolvedValueOnce(jsonResponse({ content: { titles: [] } }))
      .mockResolvedValueOnce(jsonResponse({ content: { titles: [] } }));

    const res = await fetchXboxProfileLive("2533274798129181", "valid-key");
    expect(res.discoveredGames).toEqual([]);
  });

  it("throws XboxApiError on 401 and 429 responses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "Unauthorized" }, 401)
    );
    await expect(fetchXboxProfileLive("MajorNelson", "bad-key")).rejects.toThrow(
      XboxApiError
    );

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "Rate limit" }, 429)
    );
    await expect(fetchXboxProfileLive("MajorNelson", "rate-key")).rejects.toThrow(
      XboxApiError
    );
  });
});
