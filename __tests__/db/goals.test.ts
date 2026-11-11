// __tests__/db/goals.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDatabase, setDbForTesting, createUser, getUserGoals, setUserGoal, deleteUserGoal } from "@/lib/db";

describe("yearly goals storage", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("GoalUser", "password123").id;
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("stores goals per year and reads them back in display order", () => {
    setUserGoal(userId, { year: 2027, kind: "backlog-reduction", target: 20, baseline: 38 });
    setUserGoal(userId, { year: 2027, kind: "games-finished", target: 12, baseline: null });
    setUserGoal(userId, { year: 2026, kind: "hours-played", target: 100, baseline: null });

    expect(getUserGoals(userId, 2027)).toEqual([
      { year: 2027, kind: "games-finished", target: 12, baseline: null },
      { year: 2027, kind: "backlog-reduction", target: 20, baseline: 38 },
    ]);
  });

  it("changes the target of a goal already set and keeps its baseline", () => {
    setUserGoal(userId, { year: 2027, kind: "backlog-reduction", target: 20, baseline: 38 });

    setUserGoal(userId, { year: 2027, kind: "backlog-reduction", target: 25, baseline: 10 });

    expect(getUserGoals(userId, 2027)).toEqual([{ year: 2027, kind: "backlog-reduction", target: 25, baseline: 38 }]);
  });

  it("deletes a goal", () => {
    setUserGoal(userId, { year: 2027, kind: "games-finished", target: 12, baseline: null });

    expect(deleteUserGoal(userId, { year: 2027, kind: "games-finished" })).toBe(true);
    expect(deleteUserGoal(userId, { year: 2027, kind: "games-finished" })).toBe(false);
    expect(getUserGoals(userId, 2027)).toEqual([]);
  });

  it("lists every goal of a user across years", () => {
    setUserGoal(userId, { year: 2026, kind: "hours-played", target: 100, baseline: null });
    setUserGoal(userId, { year: 2027, kind: "games-finished", target: 12, baseline: null });

    expect(getUserGoals(userId).map((g) => g.year)).toEqual([2027, 2026]);
  });
});
