// @vitest-environment jsdom
// __tests__/components/library/hooks/useGameLinks.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useGameLinks } from "@/components/library/hooks/useGameLinks";
import { makeOwnedGame } from "../../../helpers/gameFixtures";
import type { OwnedGame, User } from "@/lib/types";

const user = { id: "u1", username: "owner" } as User;
const steam = makeOwnedGame({ appId: 1, platform: "steam", status: "completed", playtimeHours: 20 });
const xbox = makeOwnedGame({ appId: 2, platform: "xbox", status: "unsorted", playtimeHours: 2 });

function trackOwnedGames(initial: OwnedGame[]) {
  let games = initial;
  const setOwnedGames = vi.fn((update: OwnedGame[] | ((prev: OwnedGame[]) => OwnedGame[])) => {
    games = typeof update === "function" ? update(games) : update;
  });
  return { setOwnedGames, current: () => games };
}

describe("useGameLinks", () => {
  afterEach(() => vi.restoreAllMocks());

  it("merges the copies into the copy to keep, at once, and saves it", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([steam, xbox]);
    const { result } = renderHook(() => useGameLinks({ currentUser: user, setOwnedGames: list.setOwnedGames, onError: vi.fn() }));

    await act(() => result.current.mergeGames([xbox, steam]));

    expect(list.current()[1].mergedInto).toEqual({ platform: "steam", appId: 1 });
    expect(list.current()[0].mergedInto).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/game-links", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ primary: { platform: "steam", appId: 1 }, copies: [{ platform: "xbox", appId: 2 }] }),
    }));
  });

  it("unmerges every copy of a game and saves it", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([steam, { ...xbox, mergedInto: { platform: "steam", appId: 1 } }]);
    const { result } = renderHook(() => useGameLinks({ currentUser: user, setOwnedGames: list.setOwnedGames, onError: vi.fn() }));

    await act(() => result.current.unmergeGames(steam));

    expect(list.current()[1].mergedInto).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/game-links", expect.objectContaining({
      method: "DELETE",
      body: JSON.stringify({ primary: { platform: "steam", appId: 1 } }),
    }));
  });

  it("puts the games back and explains when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    const onError = vi.fn();
    const list = trackOwnedGames([steam, xbox]);
    const { result } = renderHook(() => useGameLinks({ currentUser: user, setOwnedGames: list.setOwnedGames, onError }));

    await act(() => result.current.mergeGames([steam, xbox]));

    expect(list.current()[1].mergedInto).toBeUndefined();
    expect(onError).toHaveBeenCalledWith("La fusion n'a pas pu être enregistrée.");
  });

  it("keeps a visitor's merge in memory only", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const list = trackOwnedGames([steam, xbox]);
    const { result } = renderHook(() => useGameLinks({ currentUser: null, setOwnedGames: list.setOwnedGames, onError: vi.fn() }));

    await act(() => result.current.mergeGames([steam, xbox]));

    expect(list.current()[1].mergedInto).toEqual({ platform: "steam", appId: 1 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
