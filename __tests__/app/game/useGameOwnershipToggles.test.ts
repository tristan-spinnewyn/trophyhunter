// __tests__/app/game/useGameOwnershipToggles.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
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

  it("adds newly owned game with default backlog status and updates status via handleChangeGameStatus", async () => {
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
        status: "backlog",
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
      status: "backlog",
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
