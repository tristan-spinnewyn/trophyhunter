// __tests__/api/profile/xbox.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/xbox/route";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { jsonResponse } from "../../helpers/responses";

describe("GET /api/profile/xbox Direct Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("returns 400 when user parameter is missing", async () => {
    const res = await GET(new Request("http://localhost:3000/api/profile/xbox"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Paramètre 'user' requis");
  });

  it("registers Xbox account without API key in fallback mode", async () => {
    const res = await GET(new Request("http://localhost:3000/api/profile/xbox?user=MajorNelson"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.platform).toBe("xbox");
    expect(data.account.username).toBe("MajorNelson");
    expect(data.notice).toContain("OpenXBL");
  });

  it("synchronizes profile and title history when OpenXBL API key is provided", async () => {
    const mockProfileResponse = {
      profileUsers: [
        {
          id: "2533274812345678",
          settings: [
            { id: "Gamertag", value: "Major Nelson" },
            { id: "GameDisplayPicRaw", value: "https://avatar.xboxlive.com/pic.png" },
            { id: "Gamerscore", value: "98500" },
          ],
        },
      ],
    };

    const mockTitlesResponse = {
      titles: [
        {
          titleId: "123456",
          name: "Halo Infinite",
          displayImage: "https://images.xbox.com/halo.jpg",
          achievement: {
            currentAchievements: 50,
            totalAchievements: 50,
            currentGamerscore: 1000,
            totalGamerscore: 1000,
          },
        },
      ],
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(mockProfileResponse))
      .mockResolvedValueOnce(jsonResponse(mockTitlesResponse));

    const res = await GET(new Request("http://localhost:3000/api/profile/xbox?user=MajorNelson&key=mock-key-123"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.displayName).toBe("Major Nelson");
    expect(data.account.stats.gamerScore).toBe(98500);
    expect(data.discoveredGames).toHaveLength(1);
    expect(data.discoveredGames[0].name).toBe("Halo Infinite");
  });

  it("returns 401 error response when OpenXBL API key is rejected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "Invalid API Key" }, 401)
    );

    const res = await GET(
      new Request("http://localhost:3000/api/profile/xbox?user=MajorNelson&key=bad-key")
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("OpenXBL");
  });
});
