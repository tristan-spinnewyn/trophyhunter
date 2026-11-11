// lib/db/backlog-order.ts
import { getDb, withTransaction } from "./connection";
import type { PlatformType } from "../types";

export interface QueuedGameRef {
  readonly appId: number;
  readonly platform: PlatformType;
}

/** Makes `queue` the whole backlog queue, in order; other backlog games leave it. */
export function setUserBacklogQueue(userId: string, queue: readonly QueuedGameRef[]): void {
  const db = getDb();
  const rankStmt = db.prepare(
    "UPDATE user_games SET backlog_rank = ? WHERE user_id = ? AND app_id = ? AND platform = ? AND status = 'backlog'"
  );
  withTransaction(db, () => {
    db.prepare("UPDATE user_games SET backlog_rank = NULL WHERE user_id = ?").run(userId);
    queue.forEach((game, rank) => rankStmt.run(rank, userId, game.appId, game.platform));
  });
}

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
