// @vitest-environment jsdom
// __tests__/components/dashboard/useGameSyncHandler.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameSyncHandler } from "@/components/platform-sync/hooks/useGameSyncHandler";
import type { OwnedGame, UserAccountProfile } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const game = (appId: number, platform: string, name = `G${appId}`) =>
  ({ appId, name, headerImg: "", platform, totalAchievements: 10, unlockedCount: 1, addedAt: "x" }) as OwnedGame;
const steamGame = game(1, "steam");
const epicGame = game(2, "epic", "Alan Wake 2");
const profile = { displayName: "P", accounts: { steam: { platform: "steam", username: "gabe" } } } as unknown as UserAccountProfile;

function setup(accountProfile: UserAccountProfile = profile) {
  const deps = {
    accountProfile,
    ownedGames: [steamGame, epicGame],
    onOwnedGamesChange: vi.fn(),
    removeGame: vi.fn().mockResolvedValue(undefined),
    persistGames: vi.fn().mockResolvedValue(undefined),
    setBannerMsg: vi.fn(),
    syncSingleSteamGame: vi.fn(async (_u: string, g: OwnedGame) => ({ ...g, unlockedCount: 7 })),
    enrichEpicGamesAchievements: vi.fn(async (_e: OwnedGame[], all: OwnedGame[]) => all.map((g) => (g.appId === 2 ? { ...g, unlockedCount: 4 } : g))),
    onEpicTokenRequired: vi.fn(),
  };
  return { ...renderHook(() => useGameSyncHandler(deps)).result.current, deps };
}

describe("useGameSyncHandler", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("removes a game from memory and the server", async () => {
    const { handleRemoveGame, deps } = setup();
    await handleRemoveGame(1, "steam");
    expect(deps.onOwnedGamesChange).toHaveBeenCalledWith([epicGame]);
    expect(deps.removeGame).toHaveBeenCalledWith(1, "steam");
  });

  it("syncs a Steam game for the connected Steam account", async () => {
    const { handleSyncGame, deps } = setup();
    await handleSyncGame(steamGame);
    expect(deps.syncSingleSteamGame).toHaveBeenCalledWith("gabe", steamGame);
    expect(deps.persistGames).toHaveBeenCalledWith([{ ...steamGame, unlockedCount: 7 }]);
    expect(deps.setBannerMsg).toHaveBeenCalledWith({ type: "success", text: 'Succès de "G1" synchronisés (7/10) !' });
  });

  it("does nothing for a Steam game without a Steam account", async () => {
    const { handleSyncGame, deps } = setup({ displayName: "P", accounts: {} });
    await handleSyncGame(steamGame);
    expect(deps.syncSingleSteamGame).not.toHaveBeenCalled();
  });

  it("applies the Epic sync result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true, count: 6, totalAchievements: 12 }));
    const { handleSyncGame, deps } = setup();
    await handleSyncGame(epicGame);
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/sync?platform=epic&appId=2&name=Alan%20Wake%202");
    expect(deps.persistGames).toHaveBeenCalledWith([{ ...epicGame, unlockedCount: 6, totalAchievements: 12 }]);
  });

  it("asks for an Epic token when the server needs one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ requiresToken: true, error: "Code requis" }));
    const { handleSyncGame, deps } = setup();
    await handleSyncGame(epicGame);
    expect(deps.onEpicTokenRequired).toHaveBeenCalledWith(epicGame, "Code requis");
    expect(deps.enrichEpicGamesAchievements).not.toHaveBeenCalled();
  });

  it("falls back to the Epic enrichment when the sync fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { handleSyncGame, deps } = setup();
    await handleSyncGame(epicGame);
    expect(deps.enrichEpicGamesAchievements).toHaveBeenCalledWith([epicGame], deps.ownedGames, true);
    expect(deps.setBannerMsg).toHaveBeenCalledWith({ type: "success", text: 'Succès de "Alan Wake 2" actualisés (4/10) !' });
  });
});
