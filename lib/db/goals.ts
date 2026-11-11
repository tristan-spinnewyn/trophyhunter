// lib/db/goals.ts
import { getDb } from "./connection";
import { GOAL_KINDS, type GoalKey, type GoalKind, type YearGoal } from "../goals/year-goals";

interface GoalRow {
  readonly year: number;
  readonly kind: GoalKind;
  readonly target: number;
  readonly baseline: number | null;
}

const kindOrder = (kind: GoalKind) => GOAL_KINDS.findIndex((k) => k.kind === kind);

/** The user's goals for one year, or for every year (latest first), in display order. */
export function getUserGoals(userId: string, year?: number): YearGoal[] {
  const rows = (
    year === undefined
      ? getDb().prepare("SELECT year, kind, target, baseline FROM user_goals WHERE user_id = ?").all(userId)
      : getDb().prepare("SELECT year, kind, target, baseline FROM user_goals WHERE user_id = ? AND year = ?").all(userId, year)
  ) as unknown as GoalRow[];
  return rows
    .map(({ year: y, kind, target, baseline }) => ({ year: y, kind, target, baseline }))
    .sort((a, b) => b.year - a.year || kindOrder(a.kind) - kindOrder(b.kind));
}

/** Sets a goal; changing the target of an existing goal keeps its original baseline. */
export function setUserGoal(userId: string, goal: YearGoal): void {
  getDb()
    .prepare(
      `INSERT INTO user_goals (user_id, year, kind, target, baseline, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, year, kind) DO UPDATE SET target = excluded.target`
    )
    .run(userId, goal.year, goal.kind, goal.target, goal.baseline, new Date().toISOString());
}

/** Removes a goal; false when there was none. */
export function deleteUserGoal(userId: string, { year, kind }: GoalKey): boolean {
  const result = getDb().prepare("DELETE FROM user_goals WHERE user_id = ? AND year = ? AND kind = ?").run(userId, year, kind);
  return Number(result.changes) > 0;
}
