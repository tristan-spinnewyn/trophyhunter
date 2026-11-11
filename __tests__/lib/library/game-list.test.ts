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

  it("keeps the date a status was chosen when its platform is synced again", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 0, addedAt: "2026-01-01", status: "backlog", statusChangedAt: "2026-11-01T10:00:00.000Z" },
    ];
    const incoming: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 2, addedAt: "2026-01-05", lastPlayed: "2026-11-05T20:00:00.000Z" },
    ];

    expect(replacePlatformInList(base, "xbox", incoming)[0].statusChangedAt).toBe("2026-11-01T10:00:00.000Z");
    expect(mergeGamesList(base, incoming)[0].statusChangedAt).toBe("2026-11-01T10:00:00.000Z");
  });

  it("keeps the date a game was finished when its platform is synced again", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 50, addedAt: "2026-01-01", status: "completed", completedAt: "2026-05-01T10:00:00.000Z" },
    ];
    const incoming: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 50, addedAt: "2026-01-05" },
    ];

    expect(replacePlatformInList(base, "xbox", incoming)[0].completedAt).toBe("2026-05-01T10:00:00.000Z");
    expect(mergeGamesList(base, incoming)[0].completedAt).toBe("2026-05-01T10:00:00.000Z");
  });

  it("keeps the rating and review when the platform is synced again", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 50, addedAt: "2026-01-01", status: "completed", rating: 5, review: "Culte." },
    ];
    const incoming: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 50, addedAt: "2026-01-05" },
    ];

    expect(replacePlatformInList(base, "xbox", incoming)[0]).toMatchObject({ rating: 5, review: "Culte." });
    expect(mergeGamesList(base, incoming)[0]).toMatchObject({ rating: 5, review: "Culte." });
  });

  it("keeps the abandon date when the platform is synced again", () => {
    const base: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 5, addedAt: "2026-01-01", status: "abandoned", abandonedAt: "2026-05-01T10:00:00.000Z" },
    ];
    const incoming: OwnedGame[] = [
      { appId: 10, name: "Halo", headerImg: "", platform: "xbox", totalAchievements: 50, unlockedCount: 5, addedAt: "2026-01-05" },
    ];

    expect(replacePlatformInList(base, "xbox", incoming)[0].abandonedAt).toBe("2026-05-01T10:00:00.000Z");
    expect(mergeGamesList(base, incoming)[0].abandonedAt).toBe("2026-05-01T10:00:00.000Z");
  });
});

describe("replacePlatformInList: merged copies", () => {
  it("keeps the merge of a copy when its platform is synced again", () => {
    const copy = { appId: 2, name: "Hades", headerImg: "", platform: "xbox" as const, totalAchievements: 0, unlockedCount: 0, addedAt: "2026-01-01", mergedInto: { platform: "steam" as const, appId: 1 } };

    const [synced] = replacePlatformInList([copy], "xbox", [{ ...copy, mergedInto: undefined, playtimeHours: 3 }]);

    expect(synced.mergedInto).toEqual({ platform: "steam", appId: 1 });
  });
});
