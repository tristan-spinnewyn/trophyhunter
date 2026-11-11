// @vitest-environment jsdom
// __tests__/app/game/useGameReview.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useGameReview } from "@/app/game/[id]/hooks/useGameReview";
import type { OwnedGame, User } from "@/lib/types";

const portal: OwnedGame = {
  appId: 620, name: "Portal 2", headerImg: "", platform: "steam",
  totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", status: "completed", rating: 3,
};
const user = { id: "u1", username: "owner" } as User;

/** Applies the state updates the hook makes to a plain list, as React would. */
function trackOwnedGames(initial: OwnedGame[]) {
  let games = initial;
  const setOwnedGames = vi.fn((update: OwnedGame[] | ((prev: OwnedGame[]) => OwnedGame[])) => {
    games = typeof update === "function" ? update(games) : update;
  });
  return { setOwnedGames, current: () => games };
}

describe("useGameReview", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the review at once and saves it for a signed-in user", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([portal]);
    const { result } = renderHook(() => useGameReview({ owned: portal, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveReview({ rating: 5, review: "Génial." }));

    expect(list.current()[0]).toMatchObject({ rating: 5, review: "Génial." });
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/games", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ appId: 620, platform: "steam", rating: 5, review: "Génial." }),
    }));
  });

  it("clears the fields in memory", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([{ ...portal, review: "Bof." }]);
    const { result } = renderHook(() => useGameReview({ owned: portal, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveReview({ rating: null, review: null }));

    expect(list.current()[0].rating).toBeUndefined();
    expect(list.current()[0].review).toBeUndefined();
  });

  it("puts the previous review back when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    const list = trackOwnedGames([portal]);
    const { result } = renderHook(() => useGameReview({ owned: portal, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveReview({ rating: 1, review: null }));

    expect(list.current()[0].rating).toBe(3);
  });

  it("keeps a signed-out visitor's review in memory only", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const list = trackOwnedGames([portal]);
    const { result } = renderHook(() => useGameReview({ owned: portal, currentUser: null, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveReview({ rating: 4, review: null }));

    expect(list.current()[0].rating).toBe(4);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does nothing for a game outside the collection", async () => {
    const list = trackOwnedGames([]);
    const { result } = renderHook(() => useGameReview({ owned: undefined, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveReview({ rating: 4, review: null }));

    expect(list.setOwnedGames).not.toHaveBeenCalled();
  });
});
