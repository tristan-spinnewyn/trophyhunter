// lib/db/game-review.ts
import { getDb } from "./connection";
import type { PlatformType } from "../types";
import type { GameReview } from "../game-review/game-review";

/** Sets (or clears, with nulls) the owner's rating and review of a game; false when the game is not in the collection. */
export function setUserGameReview(userId: string, appId: number, platform: PlatformType, { rating, review }: GameReview): boolean {
  const result = getDb()
    .prepare("UPDATE user_games SET rating = ?, review = ? WHERE user_id = ? AND app_id = ? AND platform = ?")
    .run(rating, review, userId, appId, platform);
  return Number(result.changes) > 0;
}
