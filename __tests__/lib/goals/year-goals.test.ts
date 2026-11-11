// __tests__/lib/goals/year-goals.test.ts
import { describe, it, expect } from "vitest";
import { GOAL_KINDS, MAX_GOAL_TARGET, parseGoalInput, parseGoalKey } from "@/lib/goals/year-goals";

describe("GOAL_KINDS", () => {
  it("lists the three kinds of yearly goal in display order", () => {
    expect(GOAL_KINDS.map((k) => k.kind)).toEqual(["games-finished", "hours-played", "backlog-reduction"]);
  });
});

describe("parseGoalInput", () => {
  it("accepts a year, a known kind and a positive whole target", () => {
    expect(parseGoalInput({ year: 2027, kind: "games-finished", target: 12 })).toEqual({
      ok: true,
      goal: { year: 2027, kind: "games-finished", target: 12 },
    });
  });

  it("rejects an unknown kind, an odd year or a target out of range", () => {
    expect(parseGoalInput({ year: 2027, kind: "speedrun", target: 3 })).toMatchObject({ ok: false });
    expect(parseGoalInput({ year: 1800, kind: "hours-played", target: 3 })).toMatchObject({ ok: false });
    expect(parseGoalInput({ year: 2027.5, kind: "hours-played", target: 3 })).toMatchObject({ ok: false });
    expect(parseGoalInput({ year: 2027, kind: "hours-played", target: 0 })).toMatchObject({ ok: false });
    expect(parseGoalInput({ year: 2027, kind: "hours-played", target: 2.5 })).toMatchObject({ ok: false });
    expect(parseGoalInput({ year: 2027, kind: "hours-played", target: MAX_GOAL_TARGET + 1 })).toMatchObject({ ok: false });
    expect(parseGoalInput(null)).toMatchObject({ ok: false });
  });
});

describe("parseGoalKey", () => {
  it("accepts a year and a known kind, without a target", () => {
    expect(parseGoalKey({ year: 2027, kind: "backlog-reduction" })).toEqual({ ok: true, key: { year: 2027, kind: "backlog-reduction" } });
    expect(parseGoalKey({ year: 2027, kind: "nope" })).toMatchObject({ ok: false });
  });
});
