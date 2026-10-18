// lib/game-status/game-status.services.ts

import {
  type GameStatus,
  type GameStatusOption,
  InvalidGameStatusError,
} from "./game-status.types";

export const DEFAULT_GAME_STATUS: GameStatus = "backlog";

export const VALID_GAME_STATUSES: readonly GameStatus[] = [
  "backlog",
  "in-progress",
  "completed",
] as const;

export const GAME_STATUS_OPTIONS: readonly GameStatusOption[] = [
  {
    value: "backlog",
    label: "Backlog",
    shortLabel: "Backlog",
    badgeClass: "border-slate-700 bg-slate-800/90 text-slate-300",
    activeButtonClass: "border-slate-500/60 bg-slate-700/80 text-white shadow-sm",
  },
  {
    value: "in-progress",
    label: "En cours",
    shortLabel: "En cours",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    activeButtonClass: "border-sky-500/60 bg-sky-500/25 text-sky-200 shadow-sm",
  },
  {
    value: "completed",
    label: "Terminé",
    shortLabel: "Terminé",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    activeButtonClass: "border-emerald-500/60 bg-emerald-500/25 text-emerald-200 shadow-sm",
  },
] as const;

export const GAME_STATUS_META: Readonly<Record<GameStatus, GameStatusOption>> = {
  backlog: GAME_STATUS_OPTIONS[0],
  "in-progress": GAME_STATUS_OPTIONS[1],
  completed: GAME_STATUS_OPTIONS[2],
};

export function isValidGameStatus(value: unknown): value is GameStatus {
  return (
    typeof value === "string" &&
    (VALID_GAME_STATUSES as readonly string[]).includes(value)
  );
}

export function resolveGameStatus(value: unknown): GameStatus {
  return isValidGameStatus(value) ? value : DEFAULT_GAME_STATUS;
}

export function assertValidGameStatus(value: unknown): GameStatus {
  if (!isValidGameStatus(value)) {
    throw new InvalidGameStatusError(value);
  }
  return value;
}
