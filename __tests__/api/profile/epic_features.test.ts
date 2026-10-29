// __tests__/api/profile/epic_features.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/profile/epic/route";
import { profileSyncRequest } from "../../helpers/profileRequests";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { emptyThirdPartyResponse, jsonResponse } from "../../helpers/responses";
import type { OwnedGame } from "@/lib/types";

describe("POST /api/profile/epic Features & Errors", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("paginates across multiple pages in library-service via cursor", async () => {
    const mockToken = { access_token: "token_paged", account_id: "epic_paged", displayName: "EpicPaged" };
    const mockPage1 = {
      records: [{ appName: "FallGuys", catalogItemId: "cat_fg", metadata: { title: "Fall Guys" } }],
      responseMetadata: { nextCursor: "cursor_p2" },
    };
    const mockPage2 = {
      records: [{ appName: "RocketLeague", catalogItemId: "cat_rl", metadata: { title: "Rocket League" } }],
    };

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse(mockPage1))
      .mockResolvedValueOnce(jsonResponse(mockPage2))
      .mockResolvedValueOnce(jsonResponse({ data: { PlayerAchievement: { playerAchievementGameRecords: { records: [] } } } }));

    const res = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": "pagination-code" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.discoveredGames).toHaveLength(2);
    expect(data.discoveredGames.some((g: OwnedGame) => g.name === "Fall Guys")).toBe(true);
    expect(data.discoveredGames.some((g: OwnedGame) => g.name === "Rocket League")).toBe(true);
  });

  it("resolves totalAchievements via Steam schema when resolveAchievements=1", async () => {
    const mockToken = { access_token: "res_token", account_id: "res_acc", displayName: "Resolver" };
    const mockLibrary = {
      records: [{ appName: "HadesEpic", catalogItemId: "cat_hades", namespace: "ns_hades", sandboxName: "Hades - Standard Edition" }],
    };
    const mockSteamSearch = { items: [{ id: 1145360, name: "Hades", tiny_image: "https://cdn.example.com/hades_tiny.jpg" }] };
    const mockSteamAch = {
      response: {
        achievements: [
          { internal_name: "A1", localized_name: "Succès 1" },
          { internal_name: "A2", localized_name: "Succès 2" },
          { internal_name: "A3", localized_name: "Succès 3" },
        ],
      },
    };

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse(mockLibrary))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(mockSteamSearch))
      .mockResolvedValueOnce(jsonResponse(mockSteamAch));

    const res = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": "resolve-code" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.discoveredGames[0].totalAchievements).toBe(3);
    expect(data.discoveredGames[0].headerImg).toContain("/apps/1145360/header.jpg");
  });

  it("handles external fetch failure gracefully with status 500", async () => {
    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse).mockRejectedValueOnce(new Error("Connection timed out"));

    const res = await POST(profileSyncRequest("epic", {}, { "x-authorization-token": "crash-code" }));
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("Impossible de joindre l'API Epic Games.");
    expect(data.details).toBe("Connection timed out");
  });
});
