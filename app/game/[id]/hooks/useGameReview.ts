// app/game/[id]/hooks/useGameReview.ts
"use client";

import type { Dispatch, SetStateAction } from "react";
import type { OwnedGame, User } from "@/lib/types";
import type { GameReview } from "@/lib/game-review/game-review";

interface UseGameReviewProps {
  readonly owned: OwnedGame | undefined;
  readonly currentUser: User | null;
  readonly setOwnedGames: Dispatch<SetStateAction<OwnedGame[]>>;
}

function withReview(game: OwnedGame, { rating, review }: GameReview): OwnedGame {
  return { ...game, rating: rating ?? undefined, review: review ?? undefined };
}

/** Rates and reviews the page's game: shown at once, saved for a signed-in user, undone if the save fails. */
export function useGameReview({ owned, currentUser, setOwnedGames }: UseGameReviewProps) {
  const applyToOwned = (review: GameReview) =>
    setOwnedGames((prev) =>
      prev.map((g) => (g.appId === owned?.appId && g.platform === owned?.platform ? withReview(g, review) : g))
    );

  const handleSaveReview = async (review: GameReview) => {
    if (!owned) return;
    const previous: GameReview = { rating: owned.rating ?? null, review: owned.review ?? null };
    applyToOwned(review);
    if (!currentUser) return;

    try {
      const res = await fetch("/api/user/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: owned.appId, platform: owned.platform, ...review }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Failed to save the review:", error);
      applyToOwned(previous);
    }
  };

  return { handleSaveReview };
}
