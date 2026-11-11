// lib/goals/goals.services.ts
// Yearly goals of a user: setting them, and measuring them against what was played.

import { getPlaySessions, getUserGoals, getUserOwnedGames, setUserGoal } from "@/lib/db";
import { buildYearReview } from "@/lib/library/year-review";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { mergeLinkedGames } from "@/lib/library/linked-games";
import type { OwnedGame } from "@/lib/types";
import { computeGoalProgress, type GoalProgress } from "./goal-progress";
import type { GoalKey } from "./year-goals";

/** Backlog games, a game merged across platforms counting once. */
const backlogSize = (games: readonly OwnedGame[]) =>
  mergeLinkedGames(games).filter((g) => resolveGameStatus(g.status) === "backlog").length;

/** Sets a goal; a backlog-reduction goal starts from the backlog as it stands now. */
export function setYearGoal(userId: string, goal: GoalKey & { readonly target: number }): void {
  const baseline = goal.kind === "backlog-reduction" ? backlogSize(getUserOwnedGames(userId)) : null;
  setUserGoal(userId, { ...goal, baseline });
}

/** The goals of a year with how far each has come. */
export function getYearGoalProgress(userId: string, year: number, now: Date): GoalProgress[] {
  const goals = getUserGoals(userId, year);
  if (goals.length === 0) return [];
  const games = getUserOwnedGames(userId);
  const review = buildYearReview(year, games, getPlaySessions(userId, { since: `${year}-01-01` }));
  const facts = { finishedCount: review.finished.length, hoursPlayed: review.hoursPlayed, backlogSize: backlogSize(games) };
  return goals.map((goal) => computeGoalProgress(goal, facts, now));
}
