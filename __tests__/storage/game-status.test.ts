// __tests__/storage/game-status.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  getOwnedGames,
  upsertOwnedGames,
  replacePlatformOwnedGames,
  updateOwnedGameStatus,
} from "@/lib/storage";
import { InvalidGameStatusError } from "@/lib/game-status/game-status.types";
import type { OwnedGame } from "@/lib/types";

describe("Storage Game Status", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults games to backlog and updates status per platform", () => {
    const initial: OwnedGame[] = [
      { appId: 10, name: "Hades", headerImg: "", platform: "steam", totalAchievements: 49, unlockedCount: 10, addedAt: "2026-01-01" },
      { appId: 10, name: "Hades", headerImg: "", platform: "epic", totalAchievements: 49, unlockedCount: 5, addedAt: "2026-01-01" },
      { appId: 20, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 20, addedAt: "2026-01-02" },
      { appId: 30, name: "Witcher 3", headerImg: "", platform: "gog", totalAchievements: 78, unlockedCount: 15, addedAt: "2026-01-03" },
    ];

    const saved = upsertOwnedGames(initial);
    expect(saved.every((g) => g.status === "backlog")).toBe(true);

    updateOwnedGameStatus(10, "steam", "completed");
    updateOwnedGameStatus(10, "epic", "in-progress");
    updateOwnedGameStatus(20, "xbox", "completed");

    const afterUpdate = getOwnedGames();
    expect(afterUpdate.find((g) => g.appId === 10 && g.platform === "steam")?.status).toBe("completed");
    expect(afterUpdate.find((g) => g.appId === 10 && g.platform === "epic")?.status).toBe("in-progress");
    expect(afterUpdate.find((g) => g.appId === 20 && g.platform === "xbox")?.status).toBe("completed");
    expect(afterUpdate.find((g) => g.appId === 30 && g.platform === "gog")?.status).toBe("backlog");
  });

  it("preserves existing status on upsert and replacePlatformOwnedGames", () => {
    upsertOwnedGames([
      { appId: 10, name: "Hades", headerImg: "", platform: "epic", totalAchievements: 49, unlockedCount: 5, addedAt: "2026-01-01", status: "completed" },
    ]);

    upsertOwnedGames([
      { appId: 10, name: "Hades", headerImg: "", platform: "epic", totalAchievements: 49, unlockedCount: 12, addedAt: "2026-01-01" },
    ]);
    expect(getOwnedGames()[0].status).toBe("completed");

    replacePlatformOwnedGames("epic", [
      { appId: 10, name: "Hades", headerImg: "", platform: "epic", totalAchievements: 49, unlockedCount: 15, addedAt: "2026-01-01" },
    ]);
    expect(getOwnedGames()[0].status).toBe("completed");

    expect(() =>
      updateOwnedGameStatus(10, "epic", "bad-status" as unknown as "backlog")
    ).toThrow(InvalidGameStatusError);
  });
});
