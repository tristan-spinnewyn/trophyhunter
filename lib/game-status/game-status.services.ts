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
    badgeClass: "border-seam bg-edge/90 text-paper-dim",
  },
  "in-progress": {
    value: "in-progress",
    label: "En cours",
    sectionTitle: "En cours",
    badgeClass: "border-lamp/40 bg-lamp/15 text-lamp-bright",
  },
  paused: {
    value: "paused",
    label: "En pause",
    sectionTitle: "En pause",
    badgeClass: "border-lamp/40 bg-lamp/10 text-lamp-bright",
  },
  completed: {
    value: "completed",
    label: "Terminé",
    sectionTitle: "Terminés",
    badgeClass: "border-done/40 bg-done/15 text-done",
  },
  abandoned: {
    value: "abandoned",
    label: "Abandonné",
    sectionTitle: "Abandonnés",
    badgeClass: "border-danger/30 bg-danger/10 text-danger",
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
