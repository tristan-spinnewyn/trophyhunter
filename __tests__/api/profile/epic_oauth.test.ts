// __tests__/api/profile/epic_oauth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/profile/epic/route";
import { profileSyncRequest } from "../../helpers/profileRequests";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { emptyThirdPartyResponse, jsonResponse } from "../../helpers/responses";

describe("POST /api/profile/epic OAuth Library Fetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("authenticates and fetches games from library-service with metadata & GraphQL", async () => {
    const mockToken = { access_token: "token_lib", account_id: "epic_456", displayName: "TrophyHunterEpic" };
    const mockLibrary = {
      records: [
        {
          appName: "AlanWake2",
          catalogItemId: "cat_aw",
          metadata: {
            title: "Alan Wake 2",
            keyImages: [{ type: "DieselStoreFrontWide", url: "https://cdn.epic.com/alanwake2.jpg" }],
          },
        },
      ],
    };
    const mockGraphQL = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              { sandboxId: "alan_wake_sandbox", totalUnlocked: 25, achievementSets: [{ isBase: true, totalUnlocked: 25 }] },
            ],
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse(mockLibrary))
      .mockResolvedValueOnce(jsonResponse(mockGraphQL));

    const res = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": "lib-code-123" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames[0].name).toBe("Alan Wake 2");
    expect(data.account.stats.totalAchievements).toBe(25);
  });
});
