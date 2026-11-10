// lib/db/backlog-order.ts
import { getDb } from "./connection";
import type { PlatformType } from "../types";

/** Places a game in the backlog queue, or takes it out with `null`. */
export function setUserGameBacklogRank(
  userId: string,
  appId: number,
  platform: PlatformType,
  rank: number | null
): void {
  getDb()
    .prepare("UPDATE user_games SET backlog_rank = ? WHERE user_id = ? AND app_id = ? AND platform = ?")
    .run(rank, userId, appId, platform);
}
