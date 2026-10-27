// __tests__/api/profile/epic_assets.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/profile/epic/route";
import { initDatabase, setDbForTesting } from "@/lib/db";
import { emptyThirdPartyResponse, jsonResponse } from "../../helpers/responses";
import type { OwnedGame } from "@/lib/types";

describe("GET /api/profile/epic Assets & Fallbacks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it("authenticates and fetches owned games from array of assets", async () => {
    const mockToken = { access_token: "token_assets", account_id: "epic_123", displayName: "EpicMaster" };
    const mockAssets = [
      { appName: "AlanWake2", catalogItemId: "cat_aw" },
      { appName: "UE_5.4", catalogItemId: "ue5" },
      { appName: "Cyberpunk2077", catalogItemId: "cat_cp" },
    ];

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse(mockAssets));

    const res = await GET(new Request("http://localhost:3000/api/profile/epic", { headers: { "x-authorization-token": "valid-code-123" } }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.discoveredGames).toHaveLength(2);
  });

  it("falls back to assets and resolves titles from catalog-public-service", async () => {
    const mockToken = { access_token: "fb_token", account_id: "epic_fb", displayName: "FallbackUser" };
    const mockAssets = [
      { appName: "002b00085aeb49b1a3f3c42e3f918f2f", catalogItemId: "cat_hades", namespace: "supergiant" },
      { appName: "ControlGame", catalogItemId: "cat_control", namespace: "remedy" },
    ];
    const mockCatalogBulk = [
      { id: "cat_hades", title: "Hades", keyImages: [{ type: "OfferImageWide", url: "https://cdn.epic.com/hades.jpg" }] },
    ];

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse({ records: [] }))
      .mockResolvedValueOnce(jsonResponse(mockAssets))
      .mockResolvedValueOnce(jsonResponse(mockCatalogBulk))
      .mockResolvedValueOnce(jsonResponse({}, 404));

    const res = await GET(new Request("http://localhost:3000/api/profile/epic", { headers: { "x-authorization-token": "fallback-code" } }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.discoveredGames.some((g: OwnedGame) => g.name === "Hades")).toBe(true);
    expect(data.discoveredGames.some((g: OwnedGame) => g.name === "Control Game")).toBe(true);
  });

  it("resolves internal Epic codenames and maps sandbox achievements", async () => {
    const mockToken = { access_token: "token_codenames", account_id: "epic_cn", displayName: "EpicExplorer" };
    const mockAssets = [
      { appName: "Angelonia", catalogItemId: "cat_wd2", namespace: "ns_watchdogs2" },
      { appName: "Catnip", catalogItemId: "cat_ctrl", namespace: "ns_control" },
    ];
    const mockGraphQL = {
      data: {
        PlayerAchievement: {
          playerAchievementGameRecords: {
            records: [
              {
                sandboxId: "ns_watchdogs2",
                totalUnlocked: 15,
                achievementSets: [{ achievementSetId: "set_wd2", isBase: true, totalUnlocked: 15, totalXP: 500 }],
              },
            ],
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockImplementation(emptyThirdPartyResponse)
      .mockResolvedValueOnce(jsonResponse(mockToken))
      .mockResolvedValueOnce(jsonResponse({ records: [] }))
      .mockResolvedValueOnce(jsonResponse(mockAssets))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(mockGraphQL));

    const res = await GET(new Request("http://localhost:3000/api/profile/epic", { headers: { "x-authorization-token": "codenames-code" } }));
    expect(res.status).toBe(200);

    const data = await res.json();
    const wd2 = data.discoveredGames.find((g: OwnedGame) => g.name === "Watch Dogs 2");
    expect(wd2).toBeDefined();
    expect(wd2?.unlockedCount).toBe(15);
  });
});
