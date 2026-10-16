// lib/db/sessions.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import type { User } from "../types";

export function createSession(userId: string, expiresInDays = 30): string {
  const db = getDb();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();

  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(nowIso);
  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(sessionId, userId, expiresAt, nowIso);

  return sessionId;
}

export function validateSession(sessionId: string): User | null {
  if (!sessionId) return null;
  const db = getDb();
  const now = new Date().toISOString();

  const row = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
        expires_at: string;
      }
    | undefined;

  if (!row) return null;

  if (row.expires_at < now) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
