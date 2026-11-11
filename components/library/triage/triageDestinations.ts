// components/library/triage/triageDestinations.ts

import type { GameStatus } from "@/lib/types";

export interface TriageDestination {
  readonly status: GameStatus;
  /** Lower-case key that sends the current game there. */
  readonly shortcut: string;
}

/** Where an unsorted game can go, in the order of the shelves. Unsorted itself is "skip". */
export const TRIAGE_DESTINATIONS: readonly TriageDestination[] = [
  { status: "backlog", shortcut: "b" },
  { status: "in-progress", shortcut: "e" },
  { status: "paused", shortcut: "p" },
  { status: "completed", shortcut: "t" },
  { status: "abandoned", shortcut: "a" },
  { status: "not-interested", shortcut: "n" },
];

export const TRIAGE_SKIP_SHORTCUT = "s";
