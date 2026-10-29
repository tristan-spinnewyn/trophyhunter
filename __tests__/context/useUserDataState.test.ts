// @vitest-environment jsdom
// __tests__/context/useUserDataState.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUserDataState } from "@/context/useUserDataState";
import type { OwnedGame } from "@/lib/types";
import { jsonResponse } from "../helpers/responses";

const user = { id: "u1", username: "gabe", displayName: "Gabe", createdAt: "2026-01-01" };
const syncPayload = {
  games: [{ appId: 1, name: "Portal", headerImg: "", platform: "steam", totalAchievements: 15, unlockedCount: 3, addedAt: "x" }],
  profile: { displayName: "Gabe", accounts: { steam: { platform: "steam", username: "gabe_steam" } } },
  steamApiKey: "key",
  favorites: [1],
  wishlist: [2],
  collections: [{ id: "c1", name: "RPG" }],
};

function mockServer(loggedIn: boolean) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url === "/api/auth/me") return loggedIn ? jsonResponse({ user }) : jsonResponse({}, 401);
    if (url === "/api/user/sync") return jsonResponse(syncPayload);
    return jsonResponse({ success: true });
  });
}

describe("useUserDataState", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads the signed-in user and applies the synced data", async () => {
    mockServer(true);
    const { result } = renderHook(() => useUserDataState());

    await waitFor(() => expect(result.current.isCheckingAuth).toBe(false));
    await waitFor(() => expect(result.current.ownedGames).toHaveLength(1));
    expect(result.current.currentUser).toEqual(user);
    expect(result.current.steamUser).toBe("gabe_steam");
    // Keys stay on the server: an older server that still sends one must not leak it into the page state.
    expect(result.current.steamApiKey).toBe("");
    expect(result.current.favorites).toEqual([1]);
    expect(result.current.wishlistIds).toEqual([2]);
    expect(result.current.collections).toEqual([{ id: "c1", name: "RPG", description: "", color: "#6366f1", gameIds: [] }]);
  });

  it("stays signed out when the session is missing or the request fails", async () => {
    mockServer(false);
    const { result } = renderHook(() => useUserDataState());
    await waitFor(() => expect(result.current.isCheckingAuth).toBe(false));
    expect(result.current.currentUser).toBeNull();

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const second = renderHook(() => useUserDataState());
    await waitFor(() => expect(second.result.current.isCheckingAuth).toBe(false));
    expect(second.result.current.currentUser).toBeNull();
  });

  it("resets everything on logout, even if the logout request fails", async () => {
    mockServer(true);
    const { result } = renderHook(() => useUserDataState());
    await waitFor(() => expect(result.current.ownedGames).toHaveLength(1));

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(() => result.current.handleLogout());

    expect(result.current.currentUser).toBeNull();
    expect(result.current.ownedGames).toEqual([]);
    expect(result.current.steamUser).toBe("");
    expect(result.current.accountProfile.accounts).toEqual({});
  });

  it("signs in and refreshes, then upserts games in memory keeping known totals", async () => {
    mockServer(false);
    const { result } = renderHook(() => useUserDataState());
    await waitFor(() => expect(result.current.isCheckingAuth).toBe(false));

    mockServer(true);
    await act(() => result.current.handleAuthSuccess(user));
    await waitFor(() => expect(result.current.ownedGames).toHaveLength(1));

    const update = { ...syncPayload.games[0], totalAchievements: 0, unlockedCount: 5 } as OwnedGame;
    await act(() => result.current.upsertOwnedGameInMemoryAndDb(update));
    expect(result.current.ownedGames[0]).toMatchObject({ unlockedCount: 5, totalAchievements: 15, status: "backlog" });

    const added = { ...update, appId: 99, platform: "gog" } as OwnedGame;
    await act(() => result.current.upsertOwnedGameInMemoryAndDb(added));
    expect(result.current.ownedGames.map((g) => g.appId)).toEqual([99, 1]);
  });
});
