// @vitest-environment jsdom
// __tests__/components/dashboard/epic-enrichment.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { resolveSingleEpicGame } from "@/components/dashboard/hooks/epicEnrichmentResolver";
import { useEpicEnrichment } from "@/components/dashboard/hooks/useEpicEnrichment";
import type { OwnedGame } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const placeholder = "https://images.unsplash.com/photo-x";
const epic = (appId: number, overrides: Partial<OwnedGame> = {}) =>
  ({ appId, name: `Epic ${appId}`, headerImg: placeholder, platform: "epic", totalAchievements: 0, unlockedCount: 0, addedAt: "x", ...overrides }) as OwnedGame;

function server(sync: unknown, details: unknown) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith("/api/sync")) return sync instanceof Response ? sync : jsonResponse(sync);
    if (url.startsWith("/api/game/")) return details instanceof Response ? details : jsonResponse(details);
    return jsonResponse({}, 404);
  });
}

describe("resolveSingleEpicGame", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("takes the unlocked count from the sync and the total and cover from the game details", async () => {
    server({ success: true, count: 4, totalAchievements: 0 }, { totalAchievements: 20, headerImg: "https://cdn/cover.jpg" });
    expect(await resolveSingleEpicGame(epic(1))).toMatchObject({ unlockedCount: 4, totalAchievements: 20, headerImg: "https://cdn/cover.jpg" });
  });

  it("ignores a sync that needs a token and keeps the game when nothing changes", async () => {
    const game = epic(2, { headerImg: "https://cdn/real.jpg", totalAchievements: 10 });
    const fetchSpy = server({ success: true, requiresToken: true, count: 9 }, {});
    expect(await resolveSingleEpicGame(game)).toBe(game);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the game unchanged when every request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const game = epic(3);
    expect(await resolveSingleEpicGame(game)).toBe(game);
  });
});

describe("useEpicEnrichment", () => {
  beforeEach(() => vi.restoreAllMocks());

  const deps = (ownedGames: OwnedGame[], isSyncingEpic = false) => ({
    ownedGames,
    onOwnedGamesChange: vi.fn(),
    setBannerMsg: vi.fn(),
    setSyncProgressText: vi.fn(),
    setIsSyncingEpic: vi.fn(),
    isSyncingEpic,
    persistGames: vi.fn().mockResolvedValue(undefined),
  });

  it("enriches Epic games automatically once when none has achievements yet", async () => {
    server({ success: true, count: 2, totalAchievements: 8 }, { totalAchievements: 8 });
    const d = deps([epic(1), epic(2, { name: "Jeu Epic (inconnu)" })]);
    const { rerender } = renderHook(() => useEpicEnrichment(d));

    await waitFor(() => expect(d.setBannerMsg).toHaveBeenCalledWith({
      type: "success", text: "Succès Epic Games détectés et enregistrés dans SQLite pour 1 jeu(x) !",
    }));
    expect(d.persistGames).toHaveBeenCalledTimes(1);
    expect(d.setIsSyncingEpic).toHaveBeenLastCalledWith(false);
    rerender();
    expect(d.persistGames).toHaveBeenCalledTimes(1);
  });

  it("does not auto-enrich while syncing or when some Epic games already have achievements", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderHook(() => useEpicEnrichment(deps([epic(1)], true)));
    renderHook(() => useEpicEnrichment(deps([epic(1), epic(2, { totalAchievements: 5 })])));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forces a refresh of games that already have achievements, in batches of five", async () => {
    server({ success: true, count: 1, totalAchievements: 3 }, { totalAchievements: 3 });
    const games = Array.from({ length: 6 }, (_, i) => epic(i + 1, { totalAchievements: 3, headerImg: "https://cdn/x.jpg" }));
    const d = deps([]);
    const { result } = renderHook(() => useEpicEnrichment(d));

    const final = await result.current.enrichEpicGamesAchievements(games, games, true);

    expect(d.persistGames).toHaveBeenCalledTimes(2);
    expect(d.setSyncProgressText).toHaveBeenCalledWith("Synchronisation des succès Epic Games (6/6)...");
    expect(final.every((g) => g.unlockedCount === 1)).toBe(true);
    expect(await result.current.enrichEpicGamesAchievements([], games)).toBe(games);
  });
});
