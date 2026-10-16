import type { OwnedGame, PlatformAccount } from "@/lib/types";
import {
  saveUserPlatformAccount,
  saveUserOwnedGames,
  saveUserGameProgress,
  saveEpicGameSandboxes,
} from "@/lib/db";
import {
  resolveEpicCodename,
  isUnsplashPlaceholder,
  DEFAULT_EPIC_COVER,
} from "@/lib/epic-codenames";
import {
  EPIC_BASIC_AUTH,
  isJunkHex,
  hashCode,
  extractBestCover,
  normalizeTitle,
} from "./helpers";
import { fetchEpicLibraryItems } from "./library";
import { batchResolveCatalogTitlesAndImages } from "./catalog";
import { fetchEpicAchievementsGraphQL } from "./achievements";
import { enrichEpicGamesWithSteamMetadata } from "./enrichment";
import {
  parseEpicAuthInput,
  loadStoredEpicCredentials,
  storeEpicCredentials,
  refreshEpicAccessToken,
} from "./credentials";
import { epicAchievementId } from "./game-achievements";

export async function syncEpicProfileWithOAuth(
  code: string,
  rawUser?: string,
  authUser?: any
): Promise<
  | { success: true; account: PlatformAccount; discoveredGames: OwnedGame[] }
  | { success: false; status: number; error: string; details?: any }
> {
  const nowIso = new Date().toISOString();

  const cleanCode = parseEpicAuthInput(code);

  let accessToken = "";
  let accountId = "";
  let refreshToken = "";
  let displayName = rawUser || "Joueur Epic";

  if (cleanCode.startsWith("eg1~")) {
    try {
      const verifyRes = await fetch(
        "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify",
        {
          headers: { Authorization: `Bearer ${cleanCode}` },
        }
      );
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        accessToken = cleanCode;
        accountId = verifyData.account_id;
        displayName = verifyData.display_name || displayName;
      }
    } catch {}
  }

  // If no direct access token and no code was passed, try using stored credentials in SQLite
  if (!accessToken && !cleanCode && authUser) {
    const stored = loadStoredEpicCredentials(authUser.id);
    if (stored?.accessToken) {
      try {
        const verifyRes = await fetch(
          "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify",
          {
            headers: { Authorization: `Bearer ${stored.accessToken}` },
          }
        );
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          accessToken = stored.accessToken;
          accountId = verifyData.account_id || stored.accountId;
          refreshToken = stored.refreshToken || "";
          displayName = verifyData.display_name || displayName;
        }
      } catch {}
    }
    // If accessToken expired, attempt refresh
    if (!accessToken && stored?.refreshToken) {
      const refreshed = await refreshEpicAccessToken(stored.refreshToken);
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
        accountId = refreshed.accountId || stored.accountId;
        refreshToken = refreshed.refreshToken || stored.refreshToken;
        storeEpicCredentials(authUser.id, {
          accessToken,
          refreshToken,
          accountId,
          displayName,
        });
      }
    }
  }

  if (!accessToken) {
    if (!cleanCode) {
      return {
        success: false,
        status: 401,
        error:
          "Code d'autorisation Epic Games expiré ou invalide (authorizationToken). Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
      };
    }

    const tokenRes = await fetch(
      "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${EPIC_BASIC_AUTH}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: cleanCode,
          token_type: "eg1",
        }).toString(),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return {
        success: false,
        status: 401,
        error:
          "Code d'autorisation Epic Games expiré ou invalide (authorizationToken). Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
        details: errText,
      };
    }

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    accountId = tokenData.account_id;
    refreshToken = tokenData.refresh_token;
    displayName = tokenData.displayName || rawUser || "Joueur Epic";
  }

  const discoveredGames: OwnedGame[] = [];
  const gameNamespaceMap = new Map<number, string>();
  let totalAchievements = 0;
  let completedGames = 0;

  if (accessToken && accountId) {
    const rawItems = await fetchEpicLibraryItems(accessToken, accountId);

    // Build namespace map for catalog queries
    const namespaceMap = new Map<string, string[]>();
    for (const item of rawItems) {
      const appName = item.appName || "";
      if (
        appName.startsWith("UE_") ||
        appName.includes("Prerequisites") ||
        appName.includes("DirectX")
      ) {
        continue;
      }

      const meta = item.metadata || {};
      const catId = item.catalogItemId || meta.catalogItemId || "";
      const ns =
        item.catalogNamespace ||
        item.namespace ||
        meta.catalogNamespace ||
        meta.namespace ||
        item.sandboxId ||
        meta.sandboxId ||
        meta.customAttributes?.SandboxId?.value ||
        "";

      const existingTitle =
        meta.title ||
        meta.itemName ||
        meta.displayName ||
        item.title ||
        item.name ||
        item.displayName ||
        resolveEpicCodename(appName) ||
        "";
      const hasGoodTitle = existingTitle && !isJunkHex(existingTitle);
      const hasGoodCover = !!extractBestCover(
        meta.keyImages || item.keyImages || meta.images || item.images,
        meta.customAttributes
      );

      if (ns && catId && (!hasGoodTitle || !hasGoodCover)) {
        const list = namespaceMap.get(ns) || [];
        if (!list.includes(catId)) {
          list.push(catId);
          namespaceMap.set(ns, list);
        }
      }
    }

    const catalogTitles = await batchResolveCatalogTitlesAndImages(
      namespaceMap,
      accessToken
    );

    // Build discoveredGames list
    const seenGameKeys = new Set<string>();

    for (const item of rawItems) {
      const appName = item.appName || "";
      const meta = item.metadata || {};

      if (
        appName.startsWith("UE_") ||
        appName.includes("Prerequisites") ||
        appName.includes("DirectX") ||
        meta.mainGameItem === false
      ) {
        continue;
      }

      const catId = item.catalogItemId || meta.catalogItemId || "";
      const catalogInfo = catId ? catalogTitles.get(catId) : undefined;

      let gameTitle =
        catalogInfo?.title ||
        meta.title ||
        meta.itemName ||
        meta.displayName ||
        item.title ||
        item.name ||
        item.displayName ||
        resolveEpicCodename(appName) ||
        "";

      if (!gameTitle && appName && !isJunkHex(appName)) {
        gameTitle = appName.replace(/([A-Z])/g, " $1").trim();
      }

      if (!gameTitle || isJunkHex(gameTitle)) {
        continue;
      }

      const coverUrl =
        catalogInfo?.image ||
        extractBestCover(
          meta.keyImages || item.keyImages || meta.images || item.images,
          meta.customAttributes
        ) ||
        item.headerImg ||
        DEFAULT_EPIC_COVER;

      const idNum = Math.abs(hashCode(catId || appName || gameTitle));
      const normKey = normalizeTitle(gameTitle);

      if (seenGameKeys.has(normKey)) {
        const existing = discoveredGames.find(
          (g) => normalizeTitle(g.name) === normKey
        );
        if (existing && coverUrl && isUnsplashPlaceholder(existing.headerImg)) {
          existing.headerImg = coverUrl;
        }
        continue;
      }
      seenGameKeys.add(normKey);

      const ns =
        item.catalogNamespace ||
        item.namespace ||
        meta.catalogNamespace ||
        meta.namespace ||
        item.sandboxId ||
        meta.sandboxId ||
        meta.customAttributes?.SandboxId?.value ||
        "";

      if (ns) {
        gameNamespaceMap.set(idNum, ns.toLowerCase());
      }

      discoveredGames.push({
        appId: idNum,
        name: gameTitle,
        headerImg: coverUrl,
        platform: "epic",
        totalAchievements: 0,
        unlockedCount: 0,
        addedAt: nowIso,
        source: "manual",
      });
    }

    // Query GraphQL achievements
    const {
      achBySandbox,
      rawTotalAchievements,
      rawCompletedGames,
    } = await fetchEpicAchievementsGraphQL(accountId, accessToken);

    // Update discoveredGames with real achievements & covers
    for (const g of discoveredGames) {
      const ns = gameNamespaceMap.get(g.appId)?.toLowerCase();
      let ach = ns ? achBySandbox.get(ns) : undefined;

      if (!ach) {
        const normGameTitle = normalizeTitle(g.name);
        for (const [sId, a] of achBySandbox.entries()) {
          const cleanSid = sId
            .replace(/^ns_?/, "")
            .replace(/_?sandbox$/, "")
            .replace(/[^a-z0-9]/g, "");
          if (
            cleanSid === normGameTitle ||
            (cleanSid.length >= 4 && normGameTitle.startsWith(cleanSid)) ||
            (normGameTitle.length >= 4 && cleanSid.startsWith(normGameTitle)) ||
            (a.gameTitle && normalizeTitle(a.gameTitle) === normGameTitle)
          ) {
            ach = a;
            break;
          }
        }
      }

      if (ach) {
        g.totalAchievements = ach.totalAchievements;
        g.unlockedCount = ach.totalUnlocked;
        if (
          ach.coverUrl &&
          (!g.headerImg || isUnsplashPlaceholder(g.headerImg))
        ) {
          g.headerImg = ach.coverUrl;
        }
      }
    }

    // If a user has achievement records for games not yet in discoveredGames, add them
    for (const [sId, ach] of achBySandbox.entries()) {
      const alreadyInGames = discoveredGames.some((g) => {
        const gNs = gameNamespaceMap.get(g.appId)?.toLowerCase();
        const cleanSid = sId
          .replace(/^ns_?/, "")
          .replace(/_?sandbox$/, "")
          .replace(/[^a-z0-9]/g, "");
        const normGameTitle = normalizeTitle(g.name);
        return (
          gNs === sId ||
          cleanSid === normGameTitle ||
          (cleanSid.length >= 4 && normGameTitle.startsWith(cleanSid)) ||
          (normGameTitle.length >= 4 && cleanSid.startsWith(normGameTitle)) ||
          (ach.gameTitle &&
            normalizeTitle(g.name) === normalizeTitle(ach.gameTitle))
        );
      });

      if (!alreadyInGames && (ach.totalAchievements > 0 || ach.totalUnlocked > 0)) {
        const syntheticId = Math.abs(hashCode(`epic_ach_${sId}`));
        let resolvedTitle =
          ach.gameTitle ||
          sId
            .replace(/^ns_?/, "")
            .replace(/_?sandbox$/, "")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .trim();

        if (!resolvedTitle || isJunkHex(resolvedTitle)) {
          resolvedTitle = resolveEpicCodename(sId) || `Jeu Epic (${sId.slice(0, 8).toUpperCase()})`;
        }

        gameNamespaceMap.set(syntheticId, sId);
        discoveredGames.push({
          appId: syntheticId,
          name: resolvedTitle,
          headerImg: ach.coverUrl || DEFAULT_EPIC_COVER,
          platform: "epic",
          totalAchievements: ach.totalAchievements,
          unlockedCount: ach.totalUnlocked,
          addedAt: nowIso,
          source: "manual",
        });
      }
    }

    // Enrich games with Steam metadata
    await enrichEpicGamesWithSteamMetadata(discoveredGames);

    const gameUnlockedTotal = discoveredGames.reduce(
      (acc, g) => acc + (g.unlockedCount || 0),
      0
    );
    totalAchievements = Math.max(rawTotalAchievements, gameUnlockedTotal);

    const gameCompletedTotal = discoveredGames.filter(
      (g) =>
        (g.unlockedCount || 0) > 0 &&
        (g.totalAchievements || 0) > 0 &&
        (g.unlockedCount || 0) >= (g.totalAchievements || 0)
    ).length;
    completedGames = Math.max(rawCompletedGames, gameCompletedTotal);

    // Auto-persist to SQLite if user is logged in
    if (authUser) {
      try {
        const plainKey = JSON.stringify({
          accessToken,
          refreshToken,
          accountId,
        });
        const account: PlatformAccount = {
          platform: "epic",
          username: accountId || rawUser || displayName,
          displayName: displayName,
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
            Array.from(gameNamespaceMap.entries()).map(([appId, sandboxId]) => ({
              appId,
              sandboxId,
            }))
          );

          for (const g of discoveredGames) {
            if ((g.unlockedCount || 0) > 0) {
              const sId = gameNamespaceMap.get(g.appId)?.toLowerCase();
              const rec = sId ? achBySandbox.get(sId) : null;
              const playerAchs = rec?.playerAchievements || [];
              const unlockedNames: string[] = playerAchs
                .filter((p: any) => p.unlocked && p.achievementName)
                .map((p: any) => p.achievementName);
              const unlockedIds =
                unlockedNames.length > 0
                  ? unlockedNames.map(epicAchievementId)
                  : Array.from(
                      { length: g.unlockedCount },
                      (_, idx) => `ach_${idx + 1}`
                    );

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
  }

  const account: PlatformAccount = {
    platform: "epic",
    username: accountId || rawUser || displayName,
    displayName: displayName,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: discoveredGames.length,
      totalAchievements,
      completedGames,
    },
  };

  return {
    success: true,
    account,
    discoveredGames,
  };
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
    stats: {
      gamesOwned: 0,
      totalAchievements: 0,
      completedGames: 0,
    },
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
    notice:
      "Compte Epic Games configuré. Vous pouvez synchroniser vos jeux avec un code temporaire ou ajouter manuellement vos jeux Epic.",
  };
}
