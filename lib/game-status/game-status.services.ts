// lib/game-status/game-status.services.ts

import {
  type GameStatus,
  type GameStatusOption,
  InvalidGameStatusError,
} from "./game-status.types";

export const DEFAULT_GAME_STATUS: GameStatus = "unsorted";

export const VALID_GAME_STATUSES: readonly GameStatus[] = [
  "unsorted",
  "backlog",
  "in-progress",
  "paused",
  "completed",
  "abandoned",
  "not-interested",
] as const;

export const GAME_STATUS_META: Readonly<Record<GameStatus, GameStatusOption>> = {
  unsorted: {
    value: "unsorted",
    label: "Non trié",
    sectionTitle: "Non triés",
    badgeClass: "border-seam bg-edge/90 text-paper-dim",
    dotClass: "bg-dust",
  },
  backlog: {
    value: "backlog",
    label: "Backlog",
    sectionTitle: "Backlog",
    badgeClass: "border-queued/40 bg-queued/10 text-queued",
    dotClass: "bg-queued",
  },
  "in-progress": {
    value: "in-progress",
    label: "En cours",
    sectionTitle: "En cours",
    badgeClass: "border-lamp/40 bg-lamp/15 text-lamp-bright",
    dotClass: "bg-lamp",
  },
  paused: {
    value: "paused",
    label: "En pause",
    sectionTitle: "En pause",
    badgeClass: "border-paused/40 bg-paused/10 text-paused",
    dotClass: "bg-paused",
  },
  completed: {
    value: "completed",
    label: "Terminé",
    sectionTitle: "Terminés",
    badgeClass: "border-done/40 bg-done/15 text-done",
    dotClass: "bg-done",
  },
  abandoned: {
    value: "abandoned",
    label: "Abandonné",
    sectionTitle: "Abandonnés",
    badgeClass: "border-dropped/40 bg-dropped/10 text-dropped",
    dotClass: "bg-dropped",
  },
  "not-interested": {
    value: "not-interested",
    label: "Pas intéressé",
    sectionTitle: "Pas intéressés",
    badgeClass: "border-seam bg-ink/60 text-faint",
    dotClass: "bg-faint",
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
