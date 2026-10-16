// lib/db/clear.ts
import { getDb, withTransaction } from "./connection";

export function clearAllUserData(userId: string): void {
  const db = getDb();
  withTransaction(db, () => {
    db.prepare("DELETE FROM collections WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_game_progress WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_games WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM platform_accounts WHERE user_id = ?").run(userId);
  });
}
