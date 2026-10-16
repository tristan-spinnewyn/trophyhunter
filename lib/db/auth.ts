import crypto from "node:crypto";
import { getDb } from "./connection";
import { hashPassword, verifyPassword } from "../crypto";
import type { User } from "../types";

export function createUser(
  username: string,
  plainPassword: string,
  displayName?: string,
  avatarUrl?: string
): User {
  const db = getDb();
  const trimmedUser = username.trim().toLowerCase();
  if (!trimmedUser || trimmedUser.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(trimmedUser);
  if (existing) {
    throw new Error("Username already taken");
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(plainPassword);
  const now = new Date().toISOString();
  const name = displayName?.trim() || username.trim();

  db.prepare(
    `INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, trimmedUser, passwordHash, name, avatarUrl || null, now, now);

  return {
    id,
    username: trimmedUser,
    displayName: name,
    avatarUrl: avatarUrl || undefined,
    createdAt: now,
  };
}

export function authenticateUser(
  username: string,
  plainPassword: string
): User | null {
  const db = getDb();
  const trimmed = username.trim().toLowerCase();
  const row = db
    .prepare(
      "SELECT id, username, password_hash, display_name, avatar_url, created_at FROM users WHERE username = ?"
    )
    .get(trimmed) as
    | {
        id: string;
        username: string;
        password_hash: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) return null;

  const valid = verifyPassword(plainPassword, row.password_hash);
  if (!valid) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

export function createSession(userId: string, expiresInDays = 30): string {
  const db = getDb();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(sessionId, userId, expiresAt, now.toISOString());

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

export function getUserById(userId: string): User | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?"
    )
    .get(userId) as
    | {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}
