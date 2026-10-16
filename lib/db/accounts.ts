// lib/db/accounts.ts
import crypto from "node:crypto";
import { getDb } from "./connection";
import { encryptSecret } from "../crypto";
import { sanitizeExternalHref } from "../security/url-validator";
import type { PlatformAccount, PlatformType } from "../types";
import { parseAccountStatsJson, serializeAccountStats } from "./accounts-meta";

export { getUserPlatformApiKey, removeUserPlatformAccount } from "./accounts-credentials";

export function getUserPlatformAccounts(userId: string): Partial<Record<PlatformType, PlatformAccount>> {
  const db = getDb();
  const rows = db.prepare(
    `SELECT platform, platform_username, display_name, avatar_url, profile_url, stats_json, connected_at, last_synced_at
     FROM platform_accounts WHERE user_id = ?`
  ).all(userId) as Array<{
    platform: PlatformType; platform_username: string; display_name: string | null;
    avatar_url: string | null; profile_url: string | null; stats_json: string | null;
    connected_at: string; last_synced_at: string | null;
  }>;

  const result: Partial<Record<PlatformType, PlatformAccount>> = {};
  for (const r of rows) {
    const { stats, meta } = parseAccountStatsJson(r.stats_json);
    result[r.platform] = {
      platform: r.platform, username: r.platform_username,
      displayName: r.display_name || r.platform_username,
      avatarUrl: sanitizeExternalHref(r.avatar_url),
      profileUrl: sanitizeExternalHref(r.profile_url),
      level: meta.level, onlineState: meta.onlineState, memberSince: meta.memberSince,
      location: meta.location, rareShowcase: meta.rareShowcase,
      connectedAt: r.connected_at, lastSyncedAt: r.last_synced_at || undefined, stats,
    };
  }
  return result;
}

export function saveUserPlatformAccount(userId: string, account: PlatformAccount, plainApiKey?: string): void {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?")
    .get(userId, account.platform) as { id: string; encrypted_api_key: string | null } | undefined;

  let encryptedKey = existing?.encrypted_api_key || null;
  if (plainApiKey !== undefined) {
    encryptedKey = plainApiKey ? encryptSecret(plainApiKey.trim()) : null;
  }

  const safeAvatarUrl = sanitizeExternalHref(account.avatarUrl) || null;
  const safeProfileUrl = sanitizeExternalHref(account.profileUrl) || null;
  const statsJson = serializeAccountStats(account);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE platform_accounts SET platform_username = ?, display_name = ?, avatar_url = ?, profile_url = ?,
       encrypted_api_key = ?, stats_json = ?, last_synced_at = ? WHERE id = ?`
    ).run(
      account.username, account.displayName || account.username, safeAvatarUrl,
      safeProfileUrl, encryptedKey, statsJson, account.lastSyncedAt || now, existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO platform_accounts (id, user_id, platform, platform_username, display_name, avatar_url, profile_url, encrypted_api_key, stats_json, connected_at, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(), userId, account.platform, account.username,
      account.displayName || account.username, safeAvatarUrl, safeProfileUrl,
      encryptedKey, statsJson, account.connectedAt || now, account.lastSyncedAt || null
    );
  }
}
