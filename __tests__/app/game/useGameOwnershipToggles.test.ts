// __tests__/app/game/useGameOwnershipToggles.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useGameOwnershipToggles } from "@/app/game/[id]/hooks/useGameOwnershipToggles";
import type { GameDetails, OwnedGame } from "@/lib/types";

const MOCK_GAME: GameDetails = {
  id: 420,
  name: "Outer Wilds",
  headerImg: "https://example.com/ow.jpg",
  totalAchievements: 31,
  achievements: [],
  guideLinks: { steamGuidesUrl: "", psthcUrl: "", youtubeUrl: "" },
};

describe("useGameOwnershipToggles", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds newly owned game with the default unsorted status and updates status via handleChangeGameStatus", async () => {
    const upsertMock = vi.fn().mockResolvedValue(undefined);
    const setFavoritesMock = vi.fn();

    const { handleToggleOwned, handleChangeGameStatus } = useGameOwnershipToggles({
      game: MOCK_GAME,
      activePlatform: "xbox",
      progress: { unlockedIds: ["A1", "A2"], notes: {} },
      currentUser: null,
      favorites: [],
      setFavorites: setFavoritesMock,
      ownedGames: [],
      upsertOwnedGameInMemoryAndDb: upsertMock,
    });

    await handleToggleOwned();
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 420,
        platform: "xbox",
        status: "unsorted",
        unlockedCount: 2,
      })
    );

    await handleChangeGameStatus("in-progress");
    expect(upsertMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        appId: 420,
        platform: "xbox",
        status: "in-progress",
      })
    );

    await handleChangeGameStatus("completed");
    expect(upsertMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        appId: 420,
        platform: "xbox",
        status: "completed",
      })
    );
  });

  it("preserves existing metadata when changing status of an already owned game", async () => {
    const upsertMock = vi.fn().mockResolvedValue(undefined);
    const existingOwned: OwnedGame = {
      appId: 420,
      name: "Outer Wilds",
      headerImg: "https://example.com/ow.jpg",
      platform: "gog",
      totalAchievements: 31,
      unlockedCount: 15,
      playtimeHours: 24,
      addedAt: "2026-01-01",
      source: "manual",
      status: "unsorted",
    };

    const { handleChangeGameStatus } = useGameOwnershipToggles({
      game: MOCK_GAME,
      activePlatform: "gog",
      progress: { unlockedIds: ["A1"], notes: {} },
      currentUser: null,
      favorites: [],
      setFavorites: vi.fn(),
      ownedGames: [existingOwned],
      upsertOwnedGameInMemoryAndDb: upsertMock,
    });

    await handleChangeGameStatus("completed");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 420,
        platform: "gog",
        playtimeHours: 24,
        unlockedCount: 15,
        status: "completed",
      })
    );
    expect(localStorage.getItem("trophyhunter_owned_games")).toBeNull();
  });
});

describe("useGameOwnershipToggles finish date", () => {
  const owned = (extra: Partial<OwnedGame> = {}): OwnedGame => ({
    appId: 420,
    name: "Outer Wilds",
    headerImg: "",
    platform: "steam",
    totalAchievements: 31,
    unlockedCount: 0,
    addedAt: "2026-01-01",
    status: "in-progress",
    ...extra,
  });

  function useToggles(ownedGames: OwnedGame[]) {
    const upsertMock = vi.fn().mockResolvedValue(undefined);
    const hooks = useGameOwnershipToggles({
      game: MOCK_GAME,
      activePlatform: "steam",
      progress: { unlockedIds: [], notes: {} },
      currentUser: null,
      favorites: [],
      setFavorites: vi.fn(),
      ownedGames,
      upsertOwnedGameInMemoryAndDb: upsertMock,
    });
    return { ...hooks, upsertMock };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dates the finish when the game is marked finished from its page", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T18:00:00.000Z"));
    const { handleChangeGameStatus, upsertMock } = useToggles([owned()]);

    await handleChangeGameStatus("completed");

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        statusChangedAt: "2026-11-11T18:00:00.000Z",
        completedAt: "2026-11-11T18:00:00.000Z",
      })
    );
  });

  it("keeps the last finish date when the game is picked up again", async () => {
    const { handleChangeGameStatus, upsertMock } = useToggles([owned({ status: "completed", completedAt: "2025-03-01T12:00:00.000Z" })]);

    await handleChangeGameStatus("in-progress");

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ completedAt: "2025-03-01T12:00:00.000Z" }));
  });

  it("records a finish date picked by hand", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T18:00:00.000Z"));
    const { handleChangeCompletedAt, upsertMock } = useToggles([owned({ status: "completed", name: "Owned name" })]);

    await handleChangeCompletedAt("2023-08-14");

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 420, platform: "steam", name: "Owned name", status: "completed", completedAt: "2023-08-14T12:00:00.000Z" })
    );
  });

  it("ignores a day that cannot be a finish date, or a game outside the collection", async () => {
    const { handleChangeCompletedAt, upsertMock } = useToggles([owned({ status: "completed" })]);
    await handleChangeCompletedAt("2999-01-01");
    await handleChangeCompletedAt("");

    const notOwned = useToggles([]);
    await notOwned.handleChangeCompletedAt("2023-08-14");

    expect(upsertMock).not.toHaveBeenCalled();
    expect(notOwned.upsertMock).not.toHaveBeenCalled();
  });
});
