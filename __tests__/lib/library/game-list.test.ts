// __tests__/lib/library/game-list.test.ts
import { describe, it, expect } from "vitest";
import { mergeGamesList, replacePlatformInList } from "@/lib/library/game-list";
import type { OwnedGame } from "@/lib/types";

describe("dashboard utils (mergeGamesList & replacePlatformInList)", () => {
  it("defaults new games to unsorted and preserves existing status on merge", () => {
    const base: OwnedGame[] = [
      { appId: 1, name: "Hades", headerImg: "img1", platform: "steam", totalAchievements: 49, unlockedCount: 10, addedAt: "2026-01-01", status: "in-progress" },
    ];
    const incoming: OwnedGame[] = [
      { appId: 1, name: "Hades", headerImg: "img1", platform: "steam", totalAchievements: 49, unlockedCount: 20, addedAt: "2026-01-02" },
      { appId: 2, name: "Celeste", headerImg: "img2", platform: "epic", totalAchievements: 30, unlockedCount: 0, addedAt: "2026-01-02" },
    ];

    const merged = mergeGamesList(base, incoming);
    const hades = merged.find((g) => g.appId === 1);
    const celeste = merged.find((g) => g.appId === 2);

    expect(hades?.status).toBe("in-progress");
    expect(hades?.unlockedCount).toBe(20);
    expect(celeste?.status).toBe("unsorted");
  });

  it("preserves status when replacing a platform list", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "https://real.img/halo.jpg", platform: "xbox", totalAchievements: 50, unlockedCount: 15, addedAt: "2026-01-01", status: "completed" },
      { appId: 20, name: "Witcher", headerImg: "https://real.img/w.jpg", platform: "gog", totalAchievements: 70, unlockedCount: 5, addedAt: "2026-01-01", status: "in-progress" },
    ];
    const incomingXbox: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "https://images.unsplash.com/photo-placeholder", platform: "xbox", totalAchievements: 50, unlockedCount: 18, addedAt: "2026-01-05" },
      { appId: 11, name: "Gears", headerImg: "https://real.img/gears.jpg", platform: "xbox", totalAchievements: 40, unlockedCount: 0, addedAt: "2026-01-05" },
    ];

    const replaced = replacePlatformInList(base, "xbox", incomingXbox);
    expect(replaced.find((g) => g.appId === 10)?.status).toBe("completed");
    expect(replaced.find((g) => g.appId === 11)?.status).toBe("unsorted");
    expect(replaced.find((g) => g.appId === 20)?.status).toBe("in-progress");
  });

  it("keeps a game's place in the backlog queue when its platform is synced again", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 0, addedAt: "2026-01-01", status: "backlog", backlogRank: -3 },
    ];
    const incoming: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 2, addedAt: "2026-01-05" },
    ];

    expect(replacePlatformInList(base, "xbox", incoming)[0].backlogRank).toBe(-3);
    expect(mergeGamesList(base, incoming)[0].backlogRank).toBe(-3);
  });
});
