// lib/library/tonight-pick.ts
// "What should I play tonight?": games still ahead, ranked for the time the owner has.

import type { GameDurations, OwnedGame } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";
import { usualDurationSeconds } from "./duration-label";
import { sortBacklogQueue } from "./backlog-order";
import { toTime } from "./date-time";

export type TimeBudget = "hour" | "evening" | "weekend";

export const TIME_BUDGETS: readonly { readonly value: TimeBudget; readonly label: string; readonly hours: number }[] = [
  { value: "hour", label: "1 h", hours: 1 },
  { value: "evening", label: "Une soirée", hours: 3 },
  { value: "weekend", label: "Un week-end", hours: 12 },
];

/** Why a game is offered, in the order picks are ranked. */
export type PickReason = "finish-tonight" | "keep-going" | "short-enough" | "next-in-queue";

export interface TonightPick {
  readonly game: OwnedGame;
  readonly reason: PickReason;
  /** Hours left to beat the game, or null when unknown. */
  readonly remainingHours: number | null;
}

type DurationsByGame = Readonly<Record<string, GameDurations>>;

/** Hours left before the usual playthrough is done; null without a duration or once it is already spent. */
export function remainingHours(game: OwnedGame, durations: DurationsByGame): number | null {
  const seconds = usualDurationSeconds(durations[`${game.platform}_${game.appId}`]);
  if (seconds === null) return null;
  const left = seconds / 3600 - (game.playtimeHours ?? 0);
  return left > 0 ? left : null;
}

const fits = (hoursLeft: number | null, budget: number): hoursLeft is number => hoursLeft !== null && hoursLeft <= budget;

/**
 * Ranks the games ahead for the time available: games that can be finished within it first,
 * then the games being played (latest session first), then backlog games short enough,
 * then the rest of the backlog in queue order. A paused game only comes back when it can be finished.
 */
export function pickGamesForTonight(games: readonly OwnedGame[], durations: DurationsByGame, budget: TimeBudget): TonightPick[] {
  const budgetHours = TIME_BUDGETS.find((b) => b.value === budget)?.hours ?? 0;
  const withRemaining = (game: OwnedGame) => ({ game, remainingHours: remainingHours(game, durations) });
  const byStatus = (status: string) => games.filter((g) => resolveGameStatus(g.status) === status).map(withRemaining);

  const playing = byStatus("in-progress");
  const paused = byStatus("paused");
  const backlog = sortBacklogQueue(games.filter((g) => resolveGameStatus(g.status) === "backlog")).map(withRemaining);

  const finishable = [...playing, ...paused]
    .filter((p) => fits(p.remainingHours, budgetHours))
    .sort((a, b) => (a.remainingHours ?? 0) - (b.remainingHours ?? 0))
    .map((p) => ({ ...p, reason: "finish-tonight" as const }));
  const keepGoing = playing
    .filter((p) => !fits(p.remainingHours, budgetHours))
    .sort((a, b) => (toTime(b.game.lastPlayed) ?? 0) - (toTime(a.game.lastPlayed) ?? 0))
    .map((p) => ({ ...p, reason: "keep-going" as const }));
  const shortEnough = backlog.filter((p) => fits(p.remainingHours, budgetHours)).map((p) => ({ ...p, reason: "short-enough" as const }));
  const queue = backlog.filter((p) => !fits(p.remainingHours, budgetHours)).map((p) => ({ ...p, reason: "next-in-queue" as const }));

  return [...finishable, ...keepGoing, ...shortEnough, ...queue];
}

function aboutHours(hoursLeft: number): string {
  return hoursLeft < 1 ? "moins d'1 h" : `environ ${Math.round(hoursLeft)} h`;
}

/** One line on why the game is offered tonight. */
export function describePick({ reason, remainingHours: hoursLeft }: TonightPick): string {
  switch (reason) {
    case "finish-tonight":
      return `Tu peux le finir : il reste ${aboutHours(hoursLeft ?? 0)}`;
    case "keep-going":
      return hoursLeft === null ? "Tu y joues en ce moment" : `Tu y joues en ce moment · encore ${aboutHours(hoursLeft)}`;
    case "short-enough":
      return `Assez court pour tenir dedans : ${aboutHours(hoursLeft ?? 0)}`;
    case "next-in-queue":
      return "Le prochain de ta file";
  }
}
