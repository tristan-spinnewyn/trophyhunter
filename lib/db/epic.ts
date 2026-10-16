import { getDb, withTransaction } from "./connection";

/**
 * Persists the Epic Games sandboxId (namespace) associated with each
 * imported Epic game, so achievements can later be queried per game.
 */
export function saveEpicGameSandboxes(
  userId: string,
  entries: Array<{ appId: number; sandboxId: string }>
): void {
  const valid = entries.filter((e) => e.sandboxId);
  if (valid.length === 0) return;
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO epic_game_sandboxes (user_id, app_id, sandbox_id, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, app_id) DO UPDATE SET
       sandbox_id = excluded.sandbox_id,
       updated_at = excluded.updated_at`
  );
  const now = new Date().toISOString();
  withTransaction(db, () => {
    for (const e of valid) {
      stmt.run(userId, e.appId, e.sandboxId, now);
    }
  });
}

export function getEpicGameSandbox(
  userId: string,
  appId: number
): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT sandbox_id FROM epic_game_sandboxes WHERE user_id = ? AND app_id = ?"
    )
    .get(userId, appId) as { sandbox_id: string } | undefined;
  return row?.sandbox_id ?? null;
}
