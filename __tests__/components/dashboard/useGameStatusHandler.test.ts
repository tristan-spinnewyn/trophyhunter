// __tests__/components/dashboard/useGameStatusHandler.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStatusHandler } from "@/components/dashboard/hooks/useGameStatusHandler";
import { InvalidGameStatusError } from "@/lib/game-status/game-status.types";
import type { OwnedGame } from "@/lib/types";

describe("useGameStatusHandler", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("updates status in memory and sends PATCH request without touching legacy localStorage", async () => {
    const initialGames: OwnedGame[] = [
      { appId: 100, name: "Alan Wake 2", headerImg: "", platform: "epic", totalAchievements: 66, unlockedCount: 12, addedAt: "2026-01-01", status: "backlog" },
      { appId: 200, name: "Starfield", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 5, addedAt: "2026-01-01", status: "backlog" },
    ];

    let memoryGames = initialGames;
    const onOwnedGamesChange = vi.fn((next: OwnedGame[]) => {
      memoryGames = next;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true })));

    const { handleUpdateGameStatus } = useGameStatusHandler({
      ownedGames: memoryGames,
      onOwnedGamesChange,
    });

    await handleUpdateGameStatus(100, "epic", "completed");

    expect(onOwnedGamesChange).toHaveBeenCalledTimes(1);
    expect(memoryGames.find((g) => g.appId === 100)?.status).toBe("completed");
    expect(memoryGames.find((g) => g.appId === 200)?.status).toBe("backlog");
    expect(localStorage.getItem("trophyhunter_owned_games")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/games",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ appId: 100, platform: "epic", status: "completed" }),
      })
    );
  });

  it("rejects invalid game status before mutating state", async () => {
    const onOwnedGamesChange = vi.fn();
    const { handleUpdateGameStatus } = useGameStatusHandler({
      ownedGames: [],
      onOwnedGamesChange,
    });

    await expect(
      handleUpdateGameStatus(1, "steam", "invalid" as unknown as "backlog")
    ).rejects.toThrow(InvalidGameStatusError);
    expect(onOwnedGamesChange).not.toHaveBeenCalled();
  });
});
