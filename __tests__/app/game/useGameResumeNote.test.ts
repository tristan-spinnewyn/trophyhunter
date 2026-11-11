// @vitest-environment jsdom
// __tests__/app/game/useGameResumeNote.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useGameResumeNote } from "@/app/game/[id]/hooks/useGameResumeNote";
import type { OwnedGame, User } from "@/lib/types";

const hollowKnight: OwnedGame = {
  appId: 367520, name: "Hollow Knight", headerImg: "", platform: "steam",
  totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", status: "paused", resumeNote: "Chapitre 2.",
};
const user = { id: "u1", username: "owner" } as User;

function trackOwnedGames(initial: OwnedGame[]) {
  let games = initial;
  const setOwnedGames = vi.fn((update: OwnedGame[] | ((prev: OwnedGame[]) => OwnedGame[])) => {
    games = typeof update === "function" ? update(games) : update;
  });
  return { setOwnedGames, current: () => games };
}

describe("useGameResumeNote", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the note at once and saves it for a signed-in user", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([hollowKnight]);
    const { result } = renderHook(() => useGameResumeNote({ owned: hollowKnight, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveResumeNote("Boss Hornet."));

    expect(list.current()[0].resumeNote).toBe("Boss Hornet.");
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/games", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ appId: 367520, platform: "steam", resumeNote: "Boss Hornet." }),
    }));
  });

  it("clears the note in memory", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}"));
    const list = trackOwnedGames([hollowKnight]);
    const { result } = renderHook(() => useGameResumeNote({ owned: hollowKnight, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveResumeNote(null));

    expect(list.current()[0].resumeNote).toBeUndefined();
  });

  it("puts the previous note back when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    const list = trackOwnedGames([hollowKnight]);
    const { result } = renderHook(() => useGameResumeNote({ owned: hollowKnight, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveResumeNote("Autre chose."));

    expect(list.current()[0].resumeNote).toBe("Chapitre 2.");
  });

  it("keeps a signed-out visitor's note in memory only", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const list = trackOwnedGames([hollowKnight]);
    const { result } = renderHook(() => useGameResumeNote({ owned: hollowKnight, currentUser: null, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveResumeNote("Local."));

    expect(list.current()[0].resumeNote).toBe("Local.");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does nothing for a game outside the collection", async () => {
    const list = trackOwnedGames([]);
    const { result } = renderHook(() => useGameResumeNote({ owned: undefined, currentUser: user, setOwnedGames: list.setOwnedGames }));

    await act(() => result.current.handleSaveResumeNote("x"));

    expect(list.setOwnedGames).not.toHaveBeenCalled();
  });
});
