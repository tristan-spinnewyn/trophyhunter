// lib/game-review/game-review.ts
import type { GameStatus } from "@/lib/types";
import { resolveGameStatus } from "@/lib/game-status/game-status.services";

export const MAX_REVIEW_LENGTH = 2000;
export const MAX_RATING = 5;

/** The owner's verdict on a game; null clears a part. */
export interface GameReview {
  readonly rating: number | null;
  readonly review: string | null;
}

export type GameReviewInput = { readonly ok: true; readonly review: GameReview } | { readonly ok: false; readonly error: string };

/** A verdict only makes sense once the game is behind you: finished or abandoned. */
export function canBeReviewed(status: GameStatus | undefined): boolean {
  if (!status) return false;
  const resolved = resolveGameStatus(status);
  return resolved === "completed" || resolved === "abandoned";
}

/** Validates a rating (1 to 5, or null) and a review (trimmed text, blank meaning none). */
export function parseGameReviewInput(body: { readonly rating?: unknown; readonly review?: unknown }): GameReviewInput {
  const rating = body.rating ?? null;
  if (rating !== null && !(Number.isInteger(rating) && (rating as number) >= 1 && (rating as number) <= MAX_RATING)) {
    return { ok: false, error: "La note doit aller de 1 à 5." };
  }

  const rawReview = body.review ?? null;
  if (rawReview !== null && typeof rawReview !== "string") return { ok: false, error: "Avis invalide." };
  const review = rawReview?.trim() || null;
  if (review && review.length > MAX_REVIEW_LENGTH) {
    return { ok: false, error: `L'avis ne peut pas dépasser ${MAX_REVIEW_LENGTH} caractères.` };
  }

  return { ok: true, review: { rating: rating as number | null, review } };
}

/** "Ta note : 4/5", or null for a game not rated yet. */
export function describeRating(rating: number | undefined): string | null {
  return rating === undefined ? null : `Ta note : ${rating}/${MAX_RATING}`;
}
