// lib/db/collections-create.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import type { Collection } from "../types";

export function createCollection(
  userId: string,
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Collection {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Collection name cannot be empty");

  const existing = db
    .prepare("SELECT id, created_at FROM collections WHERE user_id = ? AND name = ? COLLATE NOCASE")
    .get(userId, trimmed) as { id: string; created_at: string } | undefined;

  if (existing) {
    return {
      id: existing.id,
      userId,
      name: trimmed,
      description: description?.trim() || undefined,
      color: color || undefined,
      icon: icon || undefined,
      createdAt: existing.created_at,
      gameCount: 0,
      gameIds: [],
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO collections (id, user_id, name, description, color, icon, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, trimmed, description?.trim() || null, color || null, icon || null, now);

  return {
    id,
    userId,
    name: trimmed,
    description: description?.trim() || undefined,
    color: color || undefined,
    icon: icon || undefined,
    createdAt: now,
    gameCount: 0,
    gameIds: [],
  };
}
