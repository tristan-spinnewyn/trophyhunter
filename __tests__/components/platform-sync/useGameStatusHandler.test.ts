// __tests__/components/platform-sync/useGameStatusHandler.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStatusHandler } from "@/components/platform-sync/hooks/useGameStatusHandler";
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

  it("takes a game out of the backlog queue when it leaves the backlog", async () => {
    const queued: OwnedGame = { appId: 1, name: "Hades", headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", status: "backlog", backlogRank: 2 };
    let memoryGames: OwnedGame[] = [queued];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

    const onOwnedGamesChange = (next: OwnedGame[]) => {
      memoryGames = next;
    };

    await useGameStatusHandler({ ownedGames: memoryGames, onOwnedGamesChange }).handleUpdateGameStatus(1, "steam", "backlog");
    expect(memoryGames[0].backlogRank).toBe(2);

    await useGameStatusHandler({ ownedGames: memoryGames, onOwnedGamesChange }).handleUpdateGameStatus(1, "steam", "in-progress");
    expect(memoryGames[0].backlogRank).toBeUndefined();
  });

  it("dates the choice of a status, so later sessions can be told apart from earlier ones", async () => {
    const game: OwnedGame = { appId: 1, name: "Hades", headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01" };
    let memoryGames: OwnedGame[] = [game];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const before = Date.now();

    await useGameStatusHandler({
      ownedGames: memoryGames,
      onOwnedGamesChange: (next) => {
        memoryGames = next;
      },
    }).handleUpdateGameStatus(1, "steam", "backlog");

    const stamped = new Date(memoryGames[0].statusChangedAt ?? "").getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(Date.now());
  });

  it("dates the finish of a game, and keeps that date when it is picked up again", async () => {
    const game: OwnedGame = { appId: 1, name: "Hades", headerImg: "", platform: "steam", totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01" };
    let memoryGames: OwnedGame[] = [game];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    const onOwnedGamesChange = (next: OwnedGame[]) => {
      memoryGames = next;
    };
    const before = Date.now();

    await useGameStatusHandler({ ownedGames: memoryGames, onOwnedGamesChange }).handleUpdateGameStatus(1, "steam", "completed");
    const finishedAt = memoryGames[0].completedAt;
    expect(new Date(finishedAt ?? "").getTime()).toBeGreaterThanOrEqual(before);

    await useGameStatusHandler({ ownedGames: memoryGames, onOwnedGamesChange }).handleUpdateGameStatus(1, "steam", "in-progress");
    expect(memoryGames[0].completedAt).toBe(finishedAt);
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
