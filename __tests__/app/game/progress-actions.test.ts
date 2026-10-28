// @vitest-environment jsdom
// __tests__/app/game/progress-actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAchievementToggles } from "@/app/game/[id]/hooks/useAchievementToggles";
import { useHuntingActions } from "@/app/game/[id]/hooks/useHuntingActions";
import type { Achievement, GameDetails, OwnedGame, UserGameProgress } from "@/lib/types";
import { jsonResponse } from "../../helpers/responses";

const user = { id: "u1", username: "gabe", displayName: "Gabe", createdAt: "x" };
const ach = (id: string): Achievement => ({ id, name: id, desc: "", icon: "", percent: 10, hidden: false, missable: false });
const game: GameDetails = {
  id: 620, name: "Portal 2", headerImg: "h.jpg", totalAchievements: 3,
  achievements: [ach("a1"), ach("a2"), ach("a3")],
  guideLinks: { steamGuidesUrl: "", psthcUrl: "", youtubeUrl: "" },
};
const owned = { appId: 620, name: "Portal 2 (owned)", headerImg: "o.jpg", platform: "steam", totalAchievements: 3, unlockedCount: 1, addedAt: "2026-01-01", source: "steam-import" } as OwnedGame;
const progress: UserGameProgress = { unlockedIds: ["a1"], notes: { a1: "easy" }, pinnedIds: ["a1", "a2"] };

const bodyOf = (spy: ReturnType<typeof vi.spyOn>, i = 0) => JSON.parse(String((spy.mock.calls[i] as [unknown, RequestInit])[1].body));

describe("useAchievementToggles", () => {
  beforeEach(() => vi.restoreAllMocks());

  const setup = (overrides: Partial<Parameters<typeof useAchievementToggles>[0]> = {}) => {
    const deps = { game, owned, activePlatform: "steam" as const, progress, setProgress: vi.fn(), currentUser: user, upsertOwnedGameInMemoryAndDb: vi.fn().mockResolvedValue(undefined), ...overrides };
    return { ...renderHook(() => useAchievementToggles(deps)).result.current, deps };
  };

  it("unlocks an achievement, updates the owned game and saves progress", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { handleToggleAchievement, deps } = setup();

    await handleToggleAchievement("a2");

    expect(vi.mocked(deps.setProgress).mock.calls[0][0].unlockedIds).toEqual(["a1", "a2"]);
    expect(deps.upsertOwnedGameInMemoryAndDb).toHaveBeenCalledWith(expect.objectContaining({ name: "Portal 2 (owned)", unlockedCount: 2, source: "steam-import" }));
    expect(bodyOf(fetchSpy)).toMatchObject({ appId: 620, platform: "steam", progress: { unlockedIds: ["a1", "a2"] } });
  });

  it("relocks an achievement without saving when signed out", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { handleToggleAchievement, deps } = setup({ currentUser: null, owned: undefined });

    await handleToggleAchievement("a1");

    expect(vi.mocked(deps.setProgress).mock.calls[0][0].unlockedIds).toEqual([]);
    expect(deps.upsertOwnedGameInMemoryAndDb).toHaveBeenCalledWith(expect.objectContaining({ name: "Portal 2", source: "manual" }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("saves and clears notes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { handleSaveNotes, deps } = setup();
    await handleSaveNotes("a2", "  use the portal gun  ");
    expect(vi.mocked(deps.setProgress).mock.calls[0][0].notes).toEqual({ a1: "easy", a2: "use the portal gun" });
    await handleSaveNotes("a1", "   ");
    expect(vi.mocked(deps.setProgress).mock.calls[1][0].notes).toEqual({});
  });

  it("resets progress and the owned game's unlocked count", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { handleResetProgress, deps } = setup();
    await handleResetProgress();
    expect(deps.setProgress).toHaveBeenCalledWith({ unlockedIds: [], notes: {} });
    expect(deps.upsertOwnedGameInMemoryAndDb).toHaveBeenCalledWith({ ...owned, unlockedCount: 0 });
    expect(fetchSpy).toHaveBeenCalledWith("/api/user/progress?appId=620&platform=steam", { method: "DELETE" });
  });

  it("ignores every action while the game is not loaded", async () => {
    const { handleToggleAchievement, handleSaveNotes, handleResetProgress, deps } = setup({ game: null });
    await handleToggleAchievement("a1");
    await handleSaveNotes("a1", "x");
    await handleResetProgress();
    expect(deps.setProgress).not.toHaveBeenCalled();
  });
});

describe("useHuntingActions", () => {
  beforeEach(() => vi.restoreAllMocks());

  const setup = (p: UserGameProgress = progress, g: GameDetails | null = game) => {
    const deps = { game: g, activePlatform: "steam" as const, progress: p, setProgress: vi.fn(), currentUser: user, setSyncNotice: vi.fn() };
    return { ...renderHook(() => useHuntingActions(deps)), deps };
  };

  it("lists pinned achievements and toggles a pin", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { result, deps } = setup();
    expect(result.current.pinnedAchievements.map((a) => a.id)).toEqual(["a1", "a2"]);

    await act(() => result.current.handleTogglePinAchievement("a3"));
    expect(vi.mocked(deps.setProgress).mock.calls[0][0].pinnedIds).toEqual(["a1", "a2", "a3"]);
    expect(bodyOf(fetchSpy).progress.pinnedIds).toEqual(["a1", "a2", "a3"]);
  });

  it("warns when the pin limit is reached", async () => {
    const full = { ...progress, pinnedIds: ["p1", "p2", "p3", "p4", "p5"] };
    const { result, deps } = setup(full);
    await act(() => result.current.handleTogglePinAchievement("a3"));
    expect(deps.setSyncNotice).toHaveBeenCalledWith({ type: "error", msg: "Maximum 5 succès épinglés en mode Chasse Active." });
    expect(deps.setProgress).not.toHaveBeenCalled();
  });

  it("clears unlocked pins, all pins, and saves a hunting override", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ success: true }));
    const { result, deps } = setup();
    await act(() => result.current.handleClearUnlockedPins());
    expect(vi.mocked(deps.setProgress).mock.calls[0][0].pinnedIds).toEqual(["a2"]);
    await act(() => result.current.handleClearAllPins());
    expect(vi.mocked(deps.setProgress).mock.calls[1][0].pinnedIds).toEqual([]);
    await act(() => result.current.handleSaveHuntingOverride(undefined));
    expect(vi.mocked(deps.setProgress).mock.calls[2][0]).toHaveProperty("huntingMeta", undefined);
    expect(result.current.huntingMeta).toBeDefined();
  });

  it("does not persist without a game", async () => {
    const { result, deps } = setup(progress, null);
    await act(() => result.current.handleClearAllPins());
    expect(deps.setProgress).not.toHaveBeenCalled();
  });
});
