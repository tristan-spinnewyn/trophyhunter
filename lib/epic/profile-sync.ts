// lib/epic/profile-sync.ts
import type { OwnedGame, PlatformAccount, User } from "@/lib/types";
import {
  saveUserPlatformAccount,
  saveUserOwnedGames,
  saveUserGameProgress,
  saveEpicGameSandboxes,
} from "@/lib/db";
import { resolveEpicTokens, type ResolvedEpicAuth } from "./credentials";
import { enrichEpicGamesWithSteamMetadata } from "./enrichment";
import { epicAchievementId } from "./game-achievements";
import {
  DEFAULT_EPIC_COVER,
  hashCode,
  isJunkHex,
  isUnsplashPlaceholder,
  normalizeTitle,
  resolveEpicCodename,
} from "./game-metadata";
import { discoverEpicGames } from "./library";
import { fetchEpicAchievementsGraphQL } from "./profile-achievements";
import type { AchSummary } from "./types";

function doesGameMatchSandbox(gameName: string, sId: string, ach: AchSummary): boolean {
  const normGameTitle = normalizeTitle(gameName);
  const cleanSid = sId.replace(/^ns_?/, "").replace(/_?sandbox$/, "").replace(/[^a-z0-9]/g, "");
  const normAchTitle = ach.gameTitle ? normalizeTitle(ach.gameTitle) : "";
  const codenameTitle = resolveEpicCodename(sId);
  const normCodename = codenameTitle ? normalizeTitle(codenameTitle) : "";

  return Boolean(
    cleanSid === normGameTitle ||
      (cleanSid.length >= 4 && normGameTitle.startsWith(cleanSid)) ||
      (normGameTitle.length >= 4 && cleanSid.startsWith(normGameTitle)) ||
      (normAchTitle && normAchTitle === normGameTitle) ||
      (normAchTitle.length >= 4 && normGameTitle.includes(normAchTitle)) ||
      (normGameTitle.length >= 4 && normAchTitle.includes(normGameTitle)) ||
      (normCodename && normCodename === normGameTitle)
  );
}

export function matchAndEnrichSandboxAchievements(
  discoveredGames: OwnedGame[],
  gameNamespaceMap: Map<number, string>,
  achBySandbox: Map<string, AchSummary>,
  nowIso: string
): void {
  for (const g of discoveredGames) {
    const ns = gameNamespaceMap.get(g.appId)?.toLowerCase();
    let ach = ns ? achBySandbox.get(ns) : undefined;

    if (!ach) {
      for (const [sId, a] of achBySandbox.entries()) {
        if (doesGameMatchSandbox(g.name, sId, a)) {
          ach = a;
          gameNamespaceMap.set(g.appId, sId);
          break;
        }
      }
    }

    if (ach) {
      if (ach.totalAchievements > 0) {
        g.totalAchievements = ach.totalAchievements;
      }
      g.unlockedCount = ach.totalUnlocked;
      if (ach.coverUrl && (!g.headerImg || isUnsplashPlaceholder(g.headerImg))) {
        g.headerImg = ach.coverUrl;
      }
    }
  }

  for (const [sId, ach] of achBySandbox.entries()) {
    const alreadyInGames = discoveredGames.some((g) => {
      const gNs = gameNamespaceMap.get(g.appId)?.toLowerCase();
      return gNs === sId || doesGameMatchSandbox(g.name, sId, ach);
    });

    if (!alreadyInGames && (ach.totalAchievements > 0 || ach.totalUnlocked > 0)) {
      const syntheticId = Math.abs(hashCode(`epic_ach_${sId}`));
      let resolvedTitle = ach.gameTitle || sId.replace(/^ns_?/, "").replace(/_?sandbox$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
      if (!resolvedTitle || isJunkHex(resolvedTitle)) {
        resolvedTitle = resolveEpicCodename(sId) || `Jeu Epic (${sId.slice(0, 8).toUpperCase()})`;
      }

      gameNamespaceMap.set(syntheticId, sId);
      discoveredGames.push({
        appId: syntheticId, name: resolvedTitle, headerImg: ach.coverUrl || DEFAULT_EPIC_COVER,
        platform: "epic", totalAchievements: ach.totalAchievements, unlockedCount: ach.totalUnlocked,
        addedAt: nowIso, source: "manual",
      });
    }
  }
}


export function persistEpicSyncData(
  auth: ResolvedEpicAuth,
  authUser: User,
  discoveredGames: OwnedGame[],
  gameNamespaceMap: Map<number, string>,
  achBySandbox: Map<string, AchSummary>,
  totalAchievements: number,
  completedGames: number,
  nowIso: string
): void {
  try {
    const plainKey = JSON.stringify({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accountId: auth.accountId,
    });
    const account: PlatformAccount = {
      platform: "epic",
      username: auth.accountId || auth.displayName,
      displayName: auth.displayName,
      connectedAt: nowIso,
      lastSyncedAt: nowIso,
      stats: {
        gamesOwned: discoveredGames.length,
        totalAchievements,
        completedGames,
      },
    };

    saveUserPlatformAccount(authUser.id, account, plainKey);
    if (discoveredGames.length > 0) {
      saveUserOwnedGames(authUser.id, discoveredGames);
      saveEpicGameSandboxes(
        authUser.id,
        Array.from(gameNamespaceMap.entries()).map(([appId, sandboxId]) => ({ appId, sandboxId }))
      );

      for (const g of discoveredGames) {
        if ((g.unlockedCount || 0) > 0) {
          const sId = gameNamespaceMap.get(g.appId)?.toLowerCase();
          const rec = sId ? achBySandbox.get(sId) : null;
          const playerAchs = rec?.playerAchievements || [];
          const unlockedNames: string[] = playerAchs
            .filter((p) => p.unlocked && p.achievementName)
            .map((p) => p.achievementName);
          const unlockedIds =
            unlockedNames.length > 0
              ? unlockedNames.map(epicAchievementId)
              : Array.from({ length: g.unlockedCount }, (_, idx) => `ach_${idx + 1}`);

          saveUserGameProgress(authUser.id, g.appId, "epic", {
            unlockedIds,
            lastPlayed: nowIso,
            notes: {},
          });
        }
      }
    }
  } catch (saveErr) {
    console.warn("Could not auto-persist Epic data to database:", saveErr);
  }
}

export async function syncEpicProfileWithOAuth(
  code: string,
  rawUser?: string,
  authUser?: User | null
): Promise<
  | { success: true; account: PlatformAccount; discoveredGames: OwnedGame[] }
  | { success: false; status: number; error: string; details?: string }
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
  authUser?: User | null
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
