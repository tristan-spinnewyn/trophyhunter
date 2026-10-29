// @vitest-environment jsdom
// __tests__/components/dashboard/useSteamSync.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { OwnedGame } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const syncSingleSteamGame = vi.fn(async (_user: string, g: OwnedGame) => ({ ...g, totalAchievements: 10, unlockedCount: g.appId === 620 ? 10 : 3 }));
vi.mock("@/components/platform-sync/hooks/useSteamSingleGameSync", () => ({
  useSteamSingleGameSync: () => ({ syncSingleSteamGame }),
}));

const { useSteamSync } = await import("@/components/platform-sync/hooks/useSteamSync");

const account = { platform: "steam", username: "gabe", displayName: "Gabe N", connectedAt: "x", stats: { gamesOwned: 1, totalAchievements: 5, completedGames: 0 } };
const discovered = [620, 400].map((appId) => ({ appId, name: `Game ${appId}`, headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "x" }));

function setup(steamApiKey = "") {
  const deps = {
    ownedGames: [] as OwnedGame[],
    onOwnedGamesChange: vi.fn(),
    onSteamUserChange: vi.fn(),
    currentUser: null,
    setBannerMsg: vi.fn(),
    setSyncProgressText: vi.fn(),
    steamInput: "gabe",
    steamApiKey,
    updateAccountProfileInMemory: vi.fn(),
    persistAccount: vi.fn().mockResolvedValue(undefined),
    persistGames: vi.fn().mockResolvedValue(undefined),
  };
  return { ...renderHook(() => useSteamSync(deps)), deps };
}

describe("useSteamSync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    syncSingleSteamGame.mockClear();
  });

  it("does nothing without a Steam user", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = setup();
    await act(() => result.current.handleConnectAndSyncSteam("   "));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("imports the profile, syncs each game and saves account stats from the synced games", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true, account, discoveredGames: discovered }));
    const { result, deps } = setup(" my key ");

    await act(() => result.current.handleConnectAndSyncSteam());

    expect(fetchSpy).toHaveBeenCalledWith("/api/profile/steam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "gabe", secret: "my key" }),
    });
    expect(deps.onSteamUserChange).toHaveBeenCalledWith("gabe");
    expect(syncSingleSteamGame).toHaveBeenCalledTimes(2);
    expect(deps.persistAccount).toHaveBeenCalledWith(
      expect.objectContaining({ stats: { gamesOwned: 2, totalAchievements: 13, completedGames: 1 } }),
      "my key"
    );
    expect(deps.persistGames).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ appId: 620, unlockedCount: 10 })]));
    expect(deps.setBannerMsg).toHaveBeenLastCalledWith(expect.objectContaining({ type: "success" }));
    expect(result.current.isSyncingSteam).toBe(false);
  });

  it("shows the profile error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: false, error: "Profil privé" }, 403));
    const { result, deps } = setup();
    await act(() => result.current.handleConnectAndSyncSteam("gabe"));
    expect(deps.setBannerMsg).toHaveBeenLastCalledWith({ type: "error", text: "Profil privé" });
    expect(deps.setSyncProgressText).toHaveBeenLastCalledWith(null);
  });
});
