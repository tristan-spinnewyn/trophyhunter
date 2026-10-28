// __tests__/lib/library/library-tracking.test.ts
import { describe, it, expect } from "vitest";
import type { GameStatus, OwnedGame } from "@/lib/types";
import {
  STATUS_SECTION_ORDER,
  calculateTrackingSummary,
  groupGamesByStatus,
} from "@/lib/library/library-tracking";

let nextId = 1;
function game(status: GameStatus | undefined, extra: Partial<OwnedGame> = {}): OwnedGame {
  const appId = nextId++;
  return {
    appId,
    name: `Game ${appId}`,
    headerImg: "",
    platform: "steam",
    totalAchievements: 10,
    unlockedCount: 0,
    addedAt: "2026-01-01",
    status,
    ...extra,
  };
}

describe("groupGamesByStatus", () => {
  it("orders sections by what to play now: in progress, to play, paused, finished, abandoned", () => {
    expect(STATUS_SECTION_ORDER).toEqual(["in-progress", "backlog", "paused", "completed", "abandoned"]);

    const sections = groupGamesByStatus([
      game("abandoned"),
      game("completed"),
      game("paused"),
      game("backlog"),
      game("in-progress"),
    ]);

    expect(sections.map((s) => s.status)).toEqual(STATUS_SECTION_ORDER);
  });

  it("skips statuses that have no game", () => {
    const sections = groupGamesByStatus([game("completed"), game("in-progress")]);

    expect(sections.map((s) => s.status)).toEqual(["in-progress", "completed"]);
  });

  it("treats a missing or unknown status as to play", () => {
    const legacy = game(undefined);
    const odd = game("dropped" as GameStatus);

    const [section] = groupGamesByStatus([legacy, odd]);

    expect(section.status).toBe("backlog");
    expect(section.games).toEqual([legacy, odd]);
  });

  it("keeps the incoming order inside a section so the chosen sort still applies", () => {
    const a = game("in-progress", { name: "B" });
    const b = game("in-progress", { name: "A" });

    expect(groupGamesByStatus([a, b])[0].games).toEqual([a, b]);
  });

  it("opens the sections you act on and folds the archive ones", () => {
    const sections = groupGamesByStatus([
      game("in-progress"),
      game("backlog"),
      game("paused"),
      game("completed"),
      game("abandoned"),
    ]);

    expect(Object.fromEntries(sections.map((s) => [s.status, s.isOpenByDefault]))).toEqual({
      "in-progress": true,
      backlog: true,
      paused: false,
      completed: false,
      abandoned: false,
    });
  });

  it("uses the plural section titles", () => {
    expect(groupGamesByStatus([game("completed")])[0].title).toBe("Terminés");
  });

  it("returns no section for an empty library", () => {
    expect(groupGamesByStatus([])).toEqual([]);
  });
});

describe("calculateTrackingSummary", () => {
  it("counts games per status, with missing statuses counted as to play", () => {
    const summary = calculateTrackingSummary([
      game("in-progress"),
      game("in-progress"),
      game("backlog"),
      game(undefined),
      game("completed"),
      game("abandoned"),
    ]);

    expect(summary.countByStatus).toEqual({
      "in-progress": 2,
      backlog: 2,
      paused: 0,
      completed: 1,
      abandoned: 1,
    });
  });

  it("sums playtime, rounded to the hour", () => {
    const summary = calculateTrackingSummary([
      game("in-progress", { playtimeHours: 10.4 }),
      game("backlog", { playtimeHours: 2.3 }),
      game("backlog"),
    ]);

    expect(summary.totalHours).toBe(13);
  });

  it("keeps achievements as a bonus: unlocked count and 100% games", () => {
    const summary = calculateTrackingSummary([
      game("completed", { totalAchievements: 10, unlockedCount: 10 }),
      game("in-progress", { totalAchievements: 20, unlockedCount: 5 }),
      game("backlog", { totalAchievements: 0, unlockedCount: 0 }),
    ]);

    expect(summary.unlockedAchievements).toBe(15);
    expect(summary.perfectGames).toBe(1);
  });

  it("returns zeros for an empty library", () => {
    expect(calculateTrackingSummary([])).toEqual({
      countByStatus: { "in-progress": 0, backlog: 0, paused: 0, completed: 0, abandoned: 0 },
      totalHours: 0,
      unlockedAchievements: 0,
      perfectGames: 0,
    });
  });
});
