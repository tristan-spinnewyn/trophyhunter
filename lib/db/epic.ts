// lib/db/epic.ts
import type { DatabaseSync } from "node:sqlite";
import { getDb, withTransaction } from "./connection";

function ensureEpicSandboxesTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS epic_game_sandboxes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL,
      sandbox_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, app_id)
    );
  `);
}

export function saveEpicGameSandboxes(
  userId: string,
  entries: ReadonlyArray<{ readonly appId: number; readonly sandboxId: string }>
): void {
  const valid = entries.filter((e) => e.sandboxId);
  if (valid.length === 0) return;
  const db = getDb();
  ensureEpicSandboxesTable(db);
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
  try {
    const db = getDb();
    ensureEpicSandboxesTable(db);
    const row = db
      .prepare(
        "SELECT sandbox_id FROM epic_game_sandboxes WHERE user_id = ? AND app_id = ?"
      )
      .get(userId, appId) as { sandbox_id: string } | undefined;
    return row?.sandbox_id ?? null;
  } catch {
    return null;
  }
}

