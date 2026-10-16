// lib/epic/credentials-store.ts
import { getUserPlatformAccounts, getUserPlatformApiKey, saveUserPlatformAccount } from "@/lib/db";

export interface EpicCredentials {
  accessToken: string;
  refreshToken: string | null;
  accountId: string;
  displayName?: string;
}

export function loadStoredEpicCredentials(userId: string): EpicCredentials | null {
  const raw = getUserPlatformApiKey(userId, "epic");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.accountId) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken || null,
      accountId: parsed.accountId,
    };
  } catch {
    return null;
  }
}

export function storeEpicCredentials(userId: string, creds: EpicCredentials): void {
  try {
    const accounts = getUserPlatformAccounts(userId);
    const account = accounts.epic || {
      platform: "epic" as const,
      username: creds.accountId,
      displayName: creds.displayName || "Joueur Epic",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
    };
    saveUserPlatformAccount(
      userId,
      account,
      JSON.stringify({
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
        accountId: creds.accountId,
      })
    );
  } catch {
    // Non-blocking persistence
  }
}
