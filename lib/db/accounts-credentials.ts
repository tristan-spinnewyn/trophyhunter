// lib/db/accounts-credentials.ts
import { getDb } from "./connection";
import { decryptSecret } from "../crypto";
import type { PlatformType } from "../types";

export function getUserPlatformApiKey(userId: string, platform: PlatformType): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT encrypted_api_key FROM platform_accounts WHERE user_id = ? AND platform = ?")
    .get(userId, platform) as { encrypted_api_key: string | null } | undefined;

  if (!row || !row.encrypted_api_key) return null;
  try {
    return decryptSecret(row.encrypted_api_key);
  } catch (err) {
    console.error("Failed to decrypt user platform API key:", err);
    return null;
  }
}

export function removeUserPlatformAccount(userId: string, platform: PlatformType): void {
  const db = getDb();
  db.prepare("DELETE FROM platform_accounts WHERE user_id = ? AND platform = ?").run(userId, platform);
}
