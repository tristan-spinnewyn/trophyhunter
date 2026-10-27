// lib/epic/service.ts
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { saveUserPlatformAccount } from "@/lib/db";
import { fetchEpicAchievementsGraphQL } from "./profile-achievements";
import { enrichEpicGamesWithSteamMetadata } from "./enrichment";
import { resolveEpicTokens } from "./credentials";
import { discoverEpicGames } from "./library";
import { matchAndEnrichSandboxAchievements } from "./service-achievements";
import { persistEpicSyncData } from "./service-persist";

export async function syncEpicProfileWithOAuth(
  code: string,
  rawUser?: string,
  authUser?: any
): Promise<
  | { success: true; account: PlatformAccount; discoveredGames: OwnedGame[] }
  | { success: false; status: number; error: string; details?: any }
> {
  const nowIso = new Date().toISOString();
  const tokenResult = await resolveEpicTokens(code, rawUser, authUser);
  if (!tokenResult.resolved) {
    return {
      success: false,
      status: tokenResult.errorStatus || 401,
      error: tokenResult.errorMsg || "Erreur d'authentification Epic Games",
      details: tokenResult.errorDetails,
    };
  }

  const auth = tokenResult.resolved;
  const { discoveredGames, gameNamespaceMap } = await discoverEpicGames(auth.accessToken, auth.accountId, nowIso);
  const { achBySandbox, rawTotalAchievements, rawCompletedGames } = await fetchEpicAchievementsGraphQL(auth.accountId, auth.accessToken);

  matchAndEnrichSandboxAchievements(discoveredGames, gameNamespaceMap, achBySandbox, nowIso);
  await enrichEpicGamesWithSteamMetadata(discoveredGames);

  const gameUnlockedTotal = discoveredGames.reduce((acc, g) => acc + (g.unlockedCount || 0), 0);
  const totalAchievements = Math.max(rawTotalAchievements, gameUnlockedTotal);
  const gameCompletedTotal = discoveredGames.filter(
    (g) => (g.unlockedCount || 0) > 0 && (g.totalAchievements || 0) > 0 && (g.unlockedCount || 0) >= (g.totalAchievements || 0)
  ).length;
  const completedGames = Math.max(rawCompletedGames, gameCompletedTotal);

  if (authUser) {
    persistEpicSyncData(auth, authUser, discoveredGames, gameNamespaceMap, achBySandbox, totalAchievements, completedGames, nowIso);
  }

  const account: PlatformAccount = {
    platform: "epic",
    username: auth.accountId || rawUser || auth.displayName,
    displayName: auth.displayName,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: { gamesOwned: discoveredGames.length, totalAchievements, completedGames },
  };

  return { success: true, account, discoveredGames };
}

export function createEpicProfileUsernameOnly(
  rawUser: string,
  authUser?: any
): { success: true; account: PlatformAccount; discoveredGames: OwnedGame[]; notice: string } {
  const nowIso = new Date().toISOString();
  const account: PlatformAccount = {
    platform: "epic",
    username: rawUser,
    displayName: rawUser,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
  };

  if (authUser) {
    try {
      saveUserPlatformAccount(authUser.id, account);
    } catch (saveErr) {
      console.warn("Could not auto-persist Epic account to database:", saveErr);
    }
  }

  return {
    success: true,
    account,
    discoveredGames: [],
    notice: "Compte Epic Games configuré. Vous pouvez synchroniser vos jeux avec un code temporaire ou ajouter manuellement vos jeux Epic.",
  };
}
