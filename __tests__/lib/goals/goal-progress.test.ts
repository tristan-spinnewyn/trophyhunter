// __tests__/lib/goals/goal-progress.test.ts
import { describe, it, expect } from "vitest";
import { computeGoalProgress, describeGoalPace, describeGoalProgress } from "@/lib/goals/goal-progress";
import type { YearGoal } from "@/lib/goals/year-goals";

const facts = { finishedCount: 5, hoursPlayed: 84, backlogSize: 30 };
const midYear = new Date("2027-07-02T12:00:00.000Z");

describe("computeGoalProgress", () => {
  it("counts the games finished in the year", () => {
    const goal: YearGoal = { year: 2027, kind: "games-finished", target: 12, baseline: null };

    expect(computeGoalProgress(goal, facts, midYear)).toMatchObject({ current: 5, ratio: 5 / 12, isReached: false });
  });

  it("counts the hours played in the year", () => {
    const goal: YearGoal = { year: 2027, kind: "hours-played", target: 80, baseline: null };

    expect(computeGoalProgress(goal, facts, midYear)).toMatchObject({ current: 84, ratio: 1, isReached: true });
  });

  it("counts the games taken off the backlog since the goal was set, never below zero", () => {
    const goal: YearGoal = { year: 2027, kind: "backlog-reduction", target: 20, baseline: 38 };

    expect(computeGoalProgress(goal, facts, midYear)).toMatchObject({ current: 8 });
    expect(computeGoalProgress({ ...goal, baseline: 25 }, facts, midYear)).toMatchObject({ current: 0 });
    expect(computeGoalProgress({ ...goal, baseline: null }, facts, midYear)).toMatchObject({ current: 0 });
  });

  it("tells whether the current year is ahead of or behind a steady pace", () => {
    const goal: YearGoal = { year: 2027, kind: "games-finished", target: 12, baseline: null };

    expect(computeGoalProgress(goal, facts, midYear).pace).toBe("behind");
    expect(computeGoalProgress({ ...goal, target: 8 }, facts, midYear).pace).toBe("ahead");
  });

  it("gives no pace for another year or a goal already reached", () => {
    const goal: YearGoal = { year: 2026, kind: "games-finished", target: 12, baseline: null };

    expect(computeGoalProgress(goal, facts, midYear).pace).toBeNull();
    expect(computeGoalProgress({ ...goal, year: 2027, target: 5 }, facts, midYear).pace).toBeNull();
  });
});

describe("describeGoalProgress", () => {
  it("phrases each kind of goal with its progress", () => {
    const at = (kind: YearGoal["kind"], current: number, target: number) =>
      describeGoalProgress({ year: 2027, kind, target, baseline: null, current, ratio: 0, isReached: false, pace: null });

    expect(at("games-finished", 5, 12)).toBe("5 / 12 jeux terminés");
    expect(at("games-finished", 1, 1)).toBe("1 / 1 jeu terminé");
    expect(at("hours-played", 84, 200)).toBe("84 / 200 h jouées");
    expect(at("backlog-reduction", 7, 20)).toBe("7 / 20 jeux sortis du backlog");
  });
});

describe("describeGoalPace", () => {
  const progress = { year: 2027, kind: "games-finished" as const, target: 12, baseline: null, current: 5, ratio: 0.4 };

  it("says whether the goal is reached, ahead or behind", () => {
    expect(describeGoalPace({ ...progress, isReached: true, pace: null })).toBe("Objectif atteint");
    expect(describeGoalPace({ ...progress, isReached: false, pace: "ahead" })).toBe("En avance sur le rythme");
    expect(describeGoalPace({ ...progress, isReached: false, pace: "behind" })).toBe("En retard sur le rythme");
    expect(describeGoalPace({ ...progress, isReached: false, pace: null })).toBeNull();
  });
});
