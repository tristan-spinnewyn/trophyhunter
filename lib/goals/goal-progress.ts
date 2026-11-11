// lib/goals/goal-progress.ts
// How far a yearly goal has come, and whether the year keeps up with it.

import type { YearGoal } from "./year-goals";

/** What the owner did in the goal's year, and the backlog as it stands. */
export interface GoalFacts {
  readonly finishedCount: number;
  readonly hoursPlayed: number;
  readonly backlogSize: number;
}

export interface GoalProgress extends YearGoal {
  readonly current: number;
  /** current / target, capped at 1. */
  readonly ratio: number;
  readonly isReached: boolean;
  /** Against a steady pace through the current year; null for another year or a goal reached. */
  readonly pace: "ahead" | "behind" | null;
}

function currentValue(goal: YearGoal, facts: GoalFacts): number {
  switch (goal.kind) {
    case "games-finished":
      return facts.finishedCount;
    case "hours-played":
      return facts.hoursPlayed;
    case "backlog-reduction":
      return goal.baseline === null ? 0 : Math.max(0, goal.baseline - facts.backlogSize);
  }
}

function elapsedShareOfYear(year: number, now: Date): number {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return (now.getTime() - start) / (end - start);
}

export function computeGoalProgress(goal: YearGoal, facts: GoalFacts, now: Date): GoalProgress {
  const current = currentValue(goal, facts);
  const isReached = current >= goal.target;
  const isCurrentYear = now.getUTCFullYear() === goal.year;
  const expected = goal.target * elapsedShareOfYear(goal.year, now);
  return {
    ...goal,
    current,
    ratio: Math.min(1, current / goal.target),
    isReached,
    pace: !isCurrentYear || isReached ? null : current >= expected ? "ahead" : "behind",
  };
}

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

/** "5 / 12 jeux terminés", "84 / 200 h jouées", "7 / 20 jeux sortis du backlog". */
export function describeGoalProgress({ kind, current, target }: GoalProgress): string {
  switch (kind) {
    case "games-finished":
      return `${current} / ${target} ${plural(target, "jeu terminé", "jeux terminés")}`;
    case "hours-played":
      return `${current} / ${target} h jouées`;
    case "backlog-reduction":
      return `${current} / ${target} ${plural(target, "jeu sorti", "jeux sortis")} du backlog`;
  }
}

/** "Objectif atteint", "En avance sur le rythme", "En retard sur le rythme", or null. */
export function describeGoalPace({ isReached, pace }: GoalProgress): string | null {
  if (isReached) return "Objectif atteint";
  if (pace === "ahead") return "En avance sur le rythme";
  if (pace === "behind") return "En retard sur le rythme";
  return null;
}
