// __tests__/lib/goals/goals.services.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDatabase, setDbForTesting, createUser, saveUserOwnedGames, getUserGoals, linkGames } from "@/lib/db";
import { getYearGoalProgress, setYearGoal } from "@/lib/goals/goals.services";
import { makeOwnedGame } from "../../helpers/gameFixtures";

const now = new Date("2027-07-02T12:00:00.000Z");

describe("yearly goals service", () => {
  let userId: string;

  beforeEach(() => {
    setDbForTesting(initDatabase(":memory:"));
    userId = createUser("GoalService", "password123").id;
    saveUserOwnedGames(userId, [
      makeOwnedGame({ appId: 1, status: "completed", completedAt: "2027-03-01T00:00:00.000Z" }),
      makeOwnedGame({ appId: 2, status: "completed", completedAt: "2026-03-01T00:00:00.000Z" }),
      makeOwnedGame({ appId: 3, status: "backlog" }),
      makeOwnedGame({ appId: 4, status: "backlog" }),
    ]);
  });

  afterEach(() => {
    setDbForTesting(null);
  });

  it("records the backlog size as the starting point of a backlog-reduction goal", () => {
    setYearGoal(userId, { year: 2027, kind: "backlog-reduction", target: 2 });
    setYearGoal(userId, { year: 2027, kind: "games-finished", target: 4 });

    expect(getUserGoals(userId, 2027)).toEqual([
      { year: 2027, kind: "games-finished", target: 4, baseline: null },
      { year: 2027, kind: "backlog-reduction", target: 2, baseline: 2 },
    ]);
  });

  it("measures each goal of the year against what was done that year", () => {
    setYearGoal(userId, { year: 2027, kind: "games-finished", target: 4 });
    setYearGoal(userId, { year: 2027, kind: "backlog-reduction", target: 2 });
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 3, status: "in-progress" })]);

    const progress = getYearGoalProgress(userId, 2027, now);

    expect(progress.map((p) => [p.kind, p.current, p.target])).toEqual([
      ["games-finished", 1, 4],
      ["backlog-reduction", 1, 2],
    ]);
  });

  it("counts a backlog game merged across platforms once", () => {
    saveUserOwnedGames(userId, [makeOwnedGame({ appId: 5, platform: "xbox", status: "backlog" })]);
    linkGames(userId, { platform: "steam", appId: 3 }, [{ platform: "xbox", appId: 5 }]);

    setYearGoal(userId, { year: 2027, kind: "backlog-reduction", target: 2 });

    expect(getUserGoals(userId, 2027)[0].baseline).toBe(2);
  });
});
