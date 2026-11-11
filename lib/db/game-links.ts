// lib/db/game-links.ts
import { getDb, withTransaction } from "./connection";
import type { GameRef } from "../types";

const sameRef = (a: GameRef, b: GameRef) => a.platform === b.platform && a.appId === b.appId;

/**
 * Merges copies into a primary game of the collection. A copy that was itself a primary hands its
 * copies over to the new primary. False, with nothing changed, when a game is missing or merged into itself.
 */
export function linkGames(userId: string, primary: GameRef, copies: readonly GameRef[]): boolean {
  if (copies.length === 0 || copies.some((c) => sameRef(c, primary))) return false;
  const db = getDb();
  const owns = db.prepare("SELECT 1 FROM user_games WHERE user_id = ? AND platform = ? AND app_id = ?");
  if ([primary, ...copies].some((g) => !owns.get(userId, g.platform, g.appId))) return false;

  const now = new Date().toISOString();
  const handOver = db.prepare(
    `UPDATE game_links SET primary_platform = ?, primary_app_id = ?
     WHERE user_id = ? AND primary_platform = ? AND primary_app_id = ?`
  );
  const link = db.prepare(
    `INSERT INTO game_links (user_id, platform, app_id, primary_platform, primary_app_id, linked_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, platform, app_id) DO UPDATE SET
       primary_platform = excluded.primary_platform,
       primary_app_id = excluded.primary_app_id,
       linked_at = excluded.linked_at`
  );
  withTransaction(db, () => {
    // The primary stops being anyone's copy.
    db.prepare("DELETE FROM game_links WHERE user_id = ? AND platform = ? AND app_id = ?").run(userId, primary.platform, primary.appId);
    for (const copy of copies) {
      handOver.run(primary.platform, primary.appId, userId, copy.platform, copy.appId);
      link.run(userId, copy.platform, copy.appId, primary.platform, primary.appId, now);
    }
  });
  return true;
}

/** Unmerges every copy of a primary game; false when it had none. */
export function unlinkGames(userId: string, primary: GameRef): boolean {
  const result = getDb()
    .prepare("DELETE FROM game_links WHERE user_id = ? AND primary_platform = ? AND primary_app_id = ?")
    .run(userId, primary.platform, primary.appId);
  return Number(result.changes) > 0;
}
