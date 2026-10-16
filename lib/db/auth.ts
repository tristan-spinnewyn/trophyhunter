// lib/db/auth.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import { hashPassword, verifyPassword } from "../crypto";
import type { User } from "../types";

export { createSession, validateSession, deleteSession } from "./sessions";

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

export function createUser(
  username: string,
  plainPassword: string,
  displayName?: string,
  avatarUrl?: string
): User {
  const db = getDb();
  const trimmedUser = username.trim().toLowerCase();
  if (!trimmedUser || trimmedUser.length < 3) throw new Error("Username must be at least 3 characters");
  if (!plainPassword || plainPassword.length < 6) throw new Error("Password must be at least 6 characters");

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(trimmedUser);
  if (existing) throw new Error("Username already taken");

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(plainPassword);
  const now = new Date().toISOString();
  const name = displayName?.trim() || username.trim();

  db.prepare(
    `INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, trimmedUser, passwordHash, name, avatarUrl || null, now, now);

  return { id, username: trimmedUser, displayName: name, avatarUrl: avatarUrl || undefined, createdAt: now };
}

export function authenticateUser(username: string, plainPassword: string): User | null {
  const db = getDb();
  const trimmed = username.trim().toLowerCase();
  const row = db
    .prepare("SELECT id, username, password_hash, display_name, avatar_url, created_at FROM users WHERE username = ?")
    .get(trimmed) as (UserRow & { password_hash: string }) | undefined;

  if (!row) return null;
  if (!verifyPassword(plainPassword, row.password_hash)) return null;
  return mapUserRow(row);
}

export function getUserById(userId: string): User | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?")
    .get(userId) as UserRow | undefined;

  return row ? mapUserRow(row) : null;
}
