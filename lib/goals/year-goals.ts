// lib/goals/year-goals.ts
// Goals set for a calendar year: what they measure and how they are validated.

export type GoalKind = "games-finished" | "hours-played" | "backlog-reduction";

export interface YearGoal {
  readonly year: number;
  readonly kind: GoalKind;
  readonly target: number;
  /** Backlog size when a backlog-reduction goal was set; null for the other kinds. */
  readonly baseline: number | null;
}

export interface GoalKindMeta {
  readonly kind: GoalKind;
  /** Field label, before the target: "Jeux à terminer". */
  readonly label: string;
}

export const GOAL_KINDS: readonly GoalKindMeta[] = [
  { kind: "games-finished", label: "Jeux à terminer" },
  { kind: "hours-played", label: "Heures à jouer" },
  { kind: "backlog-reduction", label: "Jeux à sortir du backlog" },
];

export const MAX_GOAL_TARGET = 10_000;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export interface GoalKey {
  readonly year: number;
  readonly kind: GoalKind;
}

export type GoalKeyInput = { readonly ok: true; readonly key: GoalKey } | { readonly ok: false; readonly error: string };
export type GoalInput =
  | { readonly ok: true; readonly goal: GoalKey & { readonly target: number } }
  | { readonly ok: false; readonly error: string };

const isGoalKind = (value: unknown): value is GoalKind => GOAL_KINDS.some((k) => k.kind === value);

/** A plausible calendar year for a goal (a whole number from 2000 to 2100). */
export function isGoalYear(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_YEAR && (value as number) <= MAX_YEAR;
}

/** Validates which goal is meant: a plausible year and a known kind. */
export function parseGoalKey(body: unknown): GoalKeyInput {
  const { year, kind } = (body ?? {}) as { year?: unknown; kind?: unknown };
  if (!isGoalYear(year)) return { ok: false, error: "Année invalide." };
  if (!isGoalKind(kind)) return { ok: false, error: "Type d'objectif inconnu." };
  return { ok: true, key: { year, kind } };
}

/** Validates a goal to set: its key and a whole target from 1 to MAX_GOAL_TARGET. */
export function parseGoalInput(body: unknown): GoalInput {
  const key = parseGoalKey(body);
  if (!key.ok) return key;
  const { target } = body as { target?: unknown };
  if (!Number.isInteger(target) || (target as number) < 1 || (target as number) > MAX_GOAL_TARGET) {
    return { ok: false, error: `L'objectif doit être un nombre entier entre 1 et ${MAX_GOAL_TARGET}.` };
  }
  return { ok: true, goal: { ...key.key, target: target as number } };
}
