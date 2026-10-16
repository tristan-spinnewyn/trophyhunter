// __tests__/epic/sync_token.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncEpicGame } from "@/lib/epic-sync";
import { jsonResponse } from "../helpers/responses";

describe("Epic Sync Authorization Token Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles unauthenticated request safely", async () => {
    const req = new Request("http://localhost:3000/api/sync?platform=epic&appId=12345");
    const result = await syncEpicGame(req, 12345, "Hades");

    expect(result.success).toBe(true);
    expect(result.platform).toBe("epic");
    expect(result.gameName).toBe("Hades");
    expect(result.count).toBe(0);
    expect(result.unlockedIds).toEqual([]);
  });

  it("accepts authorizationToken in query and exchanges with Epic OAuth", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "mock_exchanged_token",
          refresh_token: "mock_refresh_token",
          account_id: "epic_account_777",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            PlayerAchievement: {
              playerAchievementGameRecords: {
                records: [
                  {
                    sandboxId: "supergame",
                    totalUnlocked: 1,
                    achievementSets: [{ totalAchievements: 10, totalUnlocked: 1 }],
                    playerAchievements: [{ achievementName: "First Win", unlocked: true }],
                  },
                ],
              },
            },
          },
        })
      );

    const req = new Request(
      "http://localhost:3000/api/sync?platform=epic&appId=55501&name=Super%20Game&authorizationToken=code_12345"
    );
    const result = await syncEpicGame(req, 55501, "Super Game");

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.unlockedTitles).toEqual(["First Win"]);
  });

  it("parses JSON and URL redirect authorizationToken strings", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "mock_token_from_json",
          refresh_token: "mock_refresh_from_json",
          account_id: "epic_account_888",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } },
        })
      );

    const jsonString = encodeURIComponent(
      JSON.stringify({ authorizationCode: "auth_code_from_json" })
    );
    const req = new Request(
      `http://localhost:3000/api/sync?platform=epic&appId=55502&name=Some%20Game&authorizationToken=${jsonString}`
    );
    const result = await syncEpicGame(req, 55502, "Some Game");

    expect(result.success).toBe(true);
    expect(result.platform).toBe("epic");
  });
});
