// @vitest-environment jsdom
// __tests__/components/dashboard/epic-connect-hooks.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEpicProfileConnect } from "@/components/dashboard/hooks/useEpicProfileConnect";
import { useEpicAuthModalState } from "@/components/dashboard/hooks/useEpicAuthModalState";
import type { OwnedGame } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const epicGame = (appId: number, totalAchievements = 0) =>
  ({ appId, name: `Epic ${appId}`, headerImg: "", platform: "epic", totalAchievements, unlockedCount: 0, addedAt: "x" }) as OwnedGame;
const steamGame = { ...epicGame(1), platform: "steam", name: "Steam 1" } as OwnedGame;
const account = { platform: "epic", username: "acc", displayName: "EpicName", connectedAt: "x", stats: { gamesOwned: 2, totalAchievements: 0, completedGames: 0 } };

function setupConnect(overrides: Partial<Parameters<typeof useEpicProfileConnect>[0]> = {}) {
  const deps = {
    ownedGames: [steamGame, epicGame(50)],
    onOwnedGamesChange: vi.fn(),
    setBannerMsg: vi.fn(),
    setSyncProgressText: vi.fn(),
    setIsSyncingEpic: vi.fn(),
    epicInput: "",
    epicCode: "",
    setEpicCode: vi.fn(),
    updateAccountProfileInMemory: vi.fn(),
    persistAccount: vi.fn().mockResolvedValue(undefined),
    persistGames: vi.fn().mockResolvedValue(undefined),
    enrichEpicGamesAchievements: vi.fn(async (_epic: OwnedGame[], all: OwnedGame[]) =>
      all.map((g) => (g.platform === "epic" ? { ...g, totalAchievements: 5 } : g))),
    onRequireToken: vi.fn(),
    ...overrides,
  };
  return { ...renderHook(() => useEpicProfileConnect(deps)).result.current, deps };
}

describe("useEpicProfileConnect", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("asks for a token when neither a user nor a code is given", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { handleConnectAndSyncEpic, deps } = setupConnect();
    await handleConnectAndSyncEpic();
    expect(deps.onRequireToken).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("imports the Epic library, replaces previous Epic games and enriches them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ success: true, account, discoveredGames: [epicGame(100), epicGame(101)] })
    );
    const { handleConnectAndSyncEpic, deps } = setupConnect({ epicCode: '{"authorizationCode":"abc"}' });

    await handleConnectAndSyncEpic("  acc ");

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/profile/epic?user=acc&resolveAchievements=1");
    expect(init?.headers).toEqual({ "x-authorization-token": "abc" });
    const merged = vi.mocked(deps.onOwnedGamesChange).mock.calls[0][0] as OwnedGame[];
    expect(merged.map((g) => g.appId)).toEqual([1, 100, 101]);
    const persisted = vi.mocked(deps.persistGames).mock.calls[0];
    expect(persisted[1]).toBe("epic");
    expect((persisted[0] as OwnedGame[]).map((g) => [g.appId, g.platform, g.status])).toEqual([[100, "epic", "backlog"], [101, "epic", "backlog"]]);
    expect(deps.setBannerMsg).toHaveBeenLastCalledWith(expect.objectContaining({ type: "success", text: expect.stringContaining("2 jeux importés, dont 2 avec succès") }));
    expect(deps.setEpicCode).toHaveBeenCalledWith("");
    expect(deps.setIsSyncingEpic).toHaveBeenLastCalledWith(false);
  });

  it("saves the account and asks for a token when Epic needs one to list games", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true, account, requiresToken: true, discoveredGames: [] }));
    const { handleConnectAndSyncEpic, deps } = setupConnect({ epicInput: "acc" });
    await handleConnectAndSyncEpic();
    expect(deps.persistAccount).toHaveBeenCalledWith(account);
    expect(deps.onRequireToken).toHaveBeenCalled();
    expect(deps.onOwnedGamesChange).not.toHaveBeenCalled();
  });

  it("asks for a token, or shows the error, when the sync fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ success: false, requiresToken: true }, 401));
    const first = setupConnect({ epicInput: "acc" });
    await first.handleConnectAndSyncEpic();
    expect(first.deps.onRequireToken).toHaveBeenCalled();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ success: false, error: "Epic indisponible" }, 500));
    const second = setupConnect({ epicInput: "acc" });
    await second.handleConnectAndSyncEpic();
    expect(second.deps.setBannerMsg).toHaveBeenLastCalledWith({ type: "error", text: "Epic indisponible" });
    expect(second.deps.setSyncProgressText).toHaveBeenLastCalledWith(null);
  });
});

describe("useEpicAuthModalState", () => {
  beforeEach(() => vi.restoreAllMocks());

  const setup = () => {
    const deps = { handleConnectAndSyncEpic: vi.fn().mockResolvedValue(undefined), syncEpicGameWithData: vi.fn().mockResolvedValue(undefined) };
    return { ...renderHook(() => useEpicAuthModalState(deps)), deps };
  };

  it("opens for the library and syncs the whole profile with the token", async () => {
    const { result, deps } = setup();
    act(() => result.current.openEpicAuthModalForLibrary());
    expect(result.current.isEpicAuthModalOpen).toBe(true);

    await act(() => result.current.handleEpicModalSubmit("tok"));
    expect(deps.handleConnectAndSyncEpic).toHaveBeenCalledWith(undefined, "tok");
    expect(result.current.isEpicAuthModalOpen).toBe(false);
  });

  it("shows the library sync error", async () => {
    const { result, deps } = setup();
    deps.handleConnectAndSyncEpic.mockRejectedValueOnce(new Error("bad token"));
    await act(() => result.current.handleEpicModalSubmit("tok"));
    expect(result.current.epicAuthModalError).toBe("bad token");
    expect(result.current.isEpicModalSyncing).toBe(false);
  });

  it("syncs a single game with the token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true, unlockedCount: 3 }));
    const { result, deps } = setup();
    act(() => { result.current.setEpicAuthModalGame(epicGame(42)); result.current.setIsEpicAuthModalOpen(true); });

    await act(() => result.current.handleEpicModalSubmit("tok"));

    expect(fetchSpy.mock.calls[0][0]).toBe("/api/sync?platform=epic&appId=42&name=Epic%2042");
    expect(deps.syncEpicGameWithData).toHaveBeenCalledWith(epicGame(42), { success: true, unlockedCount: 3 });
    expect(result.current.epicAuthModalGame).toBeNull();
  });

  it("keeps the modal open with the error when the game sync is rejected, then closes cleanly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: false, error: "Code expiré" }, 401));
    const { result } = setup();
    act(() => { result.current.setEpicAuthModalGame(epicGame(42)); result.current.setIsEpicAuthModalOpen(true); });

    await act(() => result.current.handleEpicModalSubmit("tok"));
    expect(result.current.epicAuthModalError).toBe("Code expiré");
    expect(result.current.isEpicAuthModalOpen).toBe(true);

    act(() => result.current.closeEpicAuthModal());
    expect(result.current).toMatchObject({ isEpicAuthModalOpen: false, epicAuthModalGame: null, epicAuthModalError: null });
  });
});
