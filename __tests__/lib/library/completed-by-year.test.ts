// __tests__/lib/library/completed-by-year.test.ts
import { describe, it, expect } from "vitest";
import type { OwnedGame } from "@/lib/types";
import { groupCompletedByYear } from "@/lib/library/completed-by-year";

let nextId = 1;
function finished(completedAt?: string, name = `Game ${nextId}`): OwnedGame {
  const appId = nextId++;
  return {
    appId,
    name,
    headerImg: "",
    platform: "steam",
    totalAchievements: 0,
    unlockedCount: 0,
    addedAt: "2025-01-01",
    status: "completed",
    completedAt,
  };
}

describe("groupCompletedByYear", () => {
  it("groups finished games by the year they were finished, latest year first", () => {
    const hades = finished("2025-03-02T10:00:00.000Z");
    const tunic = finished("2026-06-10T10:00:00.000Z");
    const celeste = finished("2024-12-31T10:00:00.000Z");

    const groups = groupCompletedByYear([hades, tunic, celeste]);

    expect(groups.map((g) => g.label)).toEqual(["2026", "2025", "2024"]);
    expect(groups.map((g) => g.games)).toEqual([[tunic], [hades], [celeste]]);
  });

  it("lists the games of a year from the most recently finished", () => {
    const january = finished("2026-01-05T10:00:00.000Z");
    const october = finished("2026-10-05T10:00:00.000Z");
    const may = finished("2026-05-05T10:00:00.000Z");

    expect(groupCompletedByYear([january, october, may])[0].games).toEqual([october, may, january]);
  });

  it("puts games finished at an unknown date last, in their incoming order", () => {
    const old = finished(undefined);
    const odd = finished("not a date");
    const dated = finished("2026-02-01T10:00:00.000Z");

    const groups = groupCompletedByYear([old, dated, odd]);

    expect(groups.map((g) => g.label)).toEqual(["2026", "Date inconnue"]);
    expect(groups[1].games).toEqual([old, odd]);
  });

  it("uses a stable key per group", () => {
    const groups = groupCompletedByYear([finished("2026-02-01T10:00:00.000Z"), finished(undefined)]);

    expect(groups.map((g) => g.key)).toEqual(["2026", "unknown"]);
  });

  it("returns no group when nothing is finished", () => {
    expect(groupCompletedByYear([])).toEqual([]);
  });
});
