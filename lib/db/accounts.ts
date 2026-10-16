import crypto from "node:crypto";
import { getDb } from "./connection";
import { encryptSecret, decryptSecret } from "../crypto";
import type { PlatformAccount, PlatformType } from "../types";

export function getUserPlatformAccounts(
  userId: string
): Partial<Record<PlatformType, PlatformAccount>> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT platform, platform_username, display_name, avatar_url, profile_url, stats_json, connected_at, last_synced_at
       FROM platform_accounts WHERE user_id = ?`
    )
    .all(userId) as Array<{
    platform: PlatformType;
    platform_username: string;
    display_name: string | null;
    avatar_url: string | null;
    profile_url: string | null;
    stats_json: string | null;
    connected_at: string;
    last_synced_at: string | null;
  }>;

  const result: Partial<Record<PlatformType, PlatformAccount>> = {};

  for (const r of rows) {
    let stats = {
      gamesOwned: 0,
      totalAchievements: 0,
      completedGames: 0,
    };
    let meta: {
      level?: number;
      onlineState?: string;
      memberSince?: string;
      location?: string;
      rareShowcase?: PlatformAccount["rareShowcase"];
    } = {};
    if (r.stats_json) {
      try {
        const parsed = JSON.parse(r.stats_json);
        const { _meta, ...restStats } = parsed || {};
        stats = { ...stats, ...restStats };
        if (_meta && typeof _meta === "object") {
          meta = _meta;
        }
      } catch {
        // use default stats
      }
    }

    result[r.platform] = {
      platform: r.platform,
      username: r.platform_username,
      displayName: r.display_name || r.platform_username,
      avatarUrl: r.avatar_url || undefined,
      profileUrl: r.profile_url || undefined,
      level: meta.level,
      onlineState: meta.onlineState,
      memberSince: meta.memberSince,
      location: meta.location,
      rareShowcase: meta.rareShowcase,
      connectedAt: r.connected_at,
      lastSyncedAt: r.last_synced_at || undefined,
      stats,
    };
  }

  return result;
}

export function saveUserPlatformAccount(
  userId: string,
  account: PlatformAccount,
  plainApiKey?: string
): void {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id, encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?"
    )
    .get(userId, account.platform) as
    | { id: string; encrypted_api_key: string | null }
    | undefined;

  let encryptedKey = existing?.encrypted_api_key || null;
  if (plainApiKey !== undefined) {
    encryptedKey = plainApiKey ? encryptSecret(plainApiKey.trim()) : null;
  }

  const statsPayload = {
    ...(account.stats || {}),
    _meta: {
      level: account.level,
      onlineState: account.onlineState,
      memberSince: account.memberSince,
      location: account.location,
      rareShowcase: account.rareShowcase,
    },
  };
  const statsJson = JSON.stringify(statsPayload);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE platform_accounts
       SET platform_username = ?, display_name = ?, avatar_url = ?, profile_url = ?,
           encrypted_api_key = ?, stats_json = ?, last_synced_at = ?
       WHERE id = ?`
    ).run(
      account.username,
      account.displayName || account.username,
      account.avatarUrl || null,
      account.profileUrl || null,
      encryptedKey,
      statsJson,
      account.lastSyncedAt || now,
      existing.id
    );
  } else {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO platform_accounts
       (id, user_id, platform, platform_username, display_name, avatar_url, profile_url, encrypted_api_key, stats_json, connected_at, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      userId,
      account.platform,
      account.username,
      account.displayName || account.username,
      account.avatarUrl || null,
      account.profileUrl || null,
      encryptedKey,
      statsJson,
      account.connectedAt || now,
      account.lastSyncedAt || null
    );
  }
}

export function getUserPlatformApiKey(
  userId: string,
  platform: PlatformType
): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?"
    )
    .get(userId, platform) as { encrypted_api_key: string | null } | undefined;

  if (!row || !row.encrypted_api_key) return null;
  try {
    return decryptSecret(row.encrypted_api_key);
  } catch (err) {
    console.error("Failed to decrypt user platform API key:", err);
    return null;
  }
}

export function removeUserPlatformAccount(
  userId: string,
  platform: PlatformType
): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM platform_accounts WHERE user_id = ? AND platform = ?"
  ).run(userId, platform);
}
