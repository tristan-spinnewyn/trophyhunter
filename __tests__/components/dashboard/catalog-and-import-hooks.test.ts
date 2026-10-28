// @vitest-environment jsdom
// __tests__/components/dashboard/catalog-and-import-hooks.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useGamePassCatalog } from "@/components/dashboard/hooks/useGamePassCatalog";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import type { OwnedGame } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const item = (appId: number, name: string, category = "Action") => ({
  storeId: `s${appId}`, appId, name, headerImg: "", developer: "", publisher: "", category,
  shortDescription: "", hasXboxAchievements: true, isPlayAnywhere: false,
});

describe("useGamePassCatalog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads the catalog, filters it and pages it by 48", async () => {
    const catalog = Array.from({ length: 50 }, (_, i) => item(i + 1, `Game ${i + 1}`, i === 0 ? "RPG" : "Action"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ games: catalog }));
    const { result } = renderHook(() => useGamePassCatalog([]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledWith("/api/gamepass/pc");
    expect(result.current.visibleGames).toHaveLength(48);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.categories).toEqual(expect.arrayContaining(["Action", "RPG"]));

    act(() => result.current.handleLoadMore());
    expect(result.current.visibleGames).toHaveLength(50);
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.setSearchQuery("Game 1"));
    expect(result.current.filteredGames.every((g) => g.name.includes("Game 1"))).toBe(true);
  });

  it("reports API errors and supports a forced refresh", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "Catalogue indisponible" }, 503));
    const { result } = renderHook(() => useGamePassCatalog([]));
    await waitFor(() => expect(result.current.error).toBe("Catalogue indisponible"));

    fetchSpy.mockResolvedValueOnce(jsonResponse({}, 500));
    await act(() => result.current.loadCatalog(true));
    expect(fetchSpy).toHaveBeenLastCalledWith("/api/gamepass/pc?refresh=1");
    expect(result.current.error).toBe("Erreur HTTP 500");
  });
});

describe("useBulkImport", () => {
  const owned: OwnedGame[] = [];
  const setup = (steamUsername?: string) => {
    const props = {
      ownedGames: owned,
      onOwnedGamesChange: vi.fn(),
      syncSingleSteamGame: vi.fn(async (_user: string, g: OwnedGame) => ({ ...g, totalAchievements: 10 })),
      persistGames: vi.fn().mockResolvedValue(undefined),
      setBannerMsg: vi.fn(),
      steamUsername,
      onCloseModal: vi.fn(),
    };
    return { ...renderHook(() => useBulkImport(props)), props };
  };

  it("does nothing for empty text and reports text without any app id", async () => {
    const { result, props } = setup();
    await act(() => result.current.handleBulkImport());
    expect(props.setBannerMsg).not.toHaveBeenCalled();

    act(() => result.current.setBulkImportText("no ids here"));
    await act(() => result.current.handleBulkImport());
    expect(props.setBannerMsg).toHaveBeenCalledWith({ type: "error", text: "Aucun jeu ou AppID détecté dans le texte collé." });
    expect(result.current.isBulkImporting).toBe(false);
  });

  it("imports games, syncs them for a Steam user and persists the list", async () => {
    const { result, props } = setup("gabe");
    act(() => result.current.setBulkImportText("620 400"));

    await act(() => result.current.handleBulkImport());

    expect(props.syncSingleSteamGame).toHaveBeenCalledTimes(2);
    const persisted = props.persistGames.mock.calls[0][0] as OwnedGame[];
    expect(persisted.map((g) => [g.appId, g.totalAchievements])).toEqual(expect.arrayContaining([[620, 10], [400, 10]]));
    expect(props.onCloseModal).toHaveBeenCalled();
    expect(result.current.bulkImportText).toBe("");
  });

  it("imports without syncing when no Steam account is connected", async () => {
    const { result, props } = setup();
    act(() => result.current.setBulkImportText("620"));
    await act(() => result.current.handleBulkImport());
    expect(props.syncSingleSteamGame).not.toHaveBeenCalled();
    expect(props.persistGames).toHaveBeenCalledTimes(1);
  });
});
