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
  "paused",
  "completed",
  "abandoned",
] as const;

export const GAME_STATUS_META: Readonly<Record<GameStatus, GameStatusOption>> = {
  backlog: {
    value: "backlog",
    label: "À jouer",
    sectionTitle: "À jouer",
    badgeClass: "border-slate-700 bg-slate-800/90 text-slate-300",
  },
  "in-progress": {
    value: "in-progress",
    label: "En cours",
    sectionTitle: "En cours",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  },
  paused: {
    value: "paused",
    label: "En pause",
    sectionTitle: "En pause",
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  completed: {
    value: "completed",
    label: "Terminé",
    sectionTitle: "Terminés",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  abandoned: {
    value: "abandoned",
    label: "Abandonné",
    sectionTitle: "Abandonnés",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
};

export const GAME_STATUS_OPTIONS: readonly GameStatusOption[] = VALID_GAME_STATUSES.map(
  (status) => GAME_STATUS_META[status]
);

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
