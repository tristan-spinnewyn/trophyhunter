// lib/library/collection-sentence.ts

import type { TrackingSummary } from "./library-tracking";

export interface CollectionSentence {
  /** "214 jeux" */
  readonly size: string;
  /** "1 382 heures", or null when no playtime is known. */
  readonly hours: string | null;
  /** "3 en cours, 42 à jouer.", or null when nothing is being played or waiting. */
  readonly queue: string | null;
}

const formatCount = (n: number) => n.toLocaleString("fr-FR");
const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n > 1 ? many : one}`;

/** The collection header says what is on the shelves in plain words rather than in tiles. */
export function describeCollection(gamesCount: number, summary: TrackingSummary): CollectionSentence {
  const playing = summary.countByStatus["in-progress"];
  const waiting = summary.countByStatus.backlog;
  const queueParts = [
    playing > 0 ? `${formatCount(playing)} en cours` : null,
    waiting > 0 ? `${formatCount(waiting)} à jouer` : null,
  ].filter(Boolean);

  return {
    size: plural(gamesCount, "jeu", "jeux"),
    hours: summary.totalHours > 0 ? plural(summary.totalHours, "heure", "heures") : null,
    queue: queueParts.length > 0 ? `${queueParts.join(", ")}.` : null,
  };
}
