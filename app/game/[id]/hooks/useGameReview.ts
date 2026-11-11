// app/game/[id]/hooks/useGameReview.ts
"use client";

import type { GameReview } from "@/lib/game-review/game-review";
import { useOwnedGamePatch, type UseOwnedGamePatchProps } from "./useOwnedGamePatch";

/** Rates and reviews the page's game: shown at once, saved for a signed-in user, undone if the save fails. */
export function useGameReview(props: UseOwnedGamePatchProps) {
  const patchOwnedGame = useOwnedGamePatch(props);

  const handleSaveReview = (review: GameReview) =>
    patchOwnedGame({ rating: review.rating ?? undefined, review: review.review ?? undefined }, { ...review });

  return { handleSaveReview };
}
