import { NextResponse } from "next/server";
import type { OwnedGame, PlatformAccount } from "@/lib/types";

import { getAuthenticatedUser } from "@/lib/auth";
import {
  saveUserPlatformAccount,
  saveUserOwnedGames,
  saveUserGameProgress,
} from "@/lib/db";
import {
  resolveEpicCodename,
  isUnsplashPlaceholder,
  DEFAULT_EPIC_COVER,
} from "@/lib/epic-codenames";

const EPIC_CLIENT_ID = "34a02cf8f4414e29b15921876da36f9a";
const EPIC_CLIENT_SECRET = "daafbccc737745039dffe53d94fc76cf";
const EPIC_BASIC_AUTH = Buffer.from(
  `${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`
).toString("base64");

function isJunkHex(str: string): boolean {
  return /^[0-9a-f]{20,}$/i.test(str.trim());
}

function extractBestCover(rawKeyImages: any, customAttributes?: any): string {
  if (typeof rawKeyImages === "string") {
    try {
      rawKeyImages = JSON.parse(rawKeyImages);
    } catch {}
  }

  const preferred = [
    "DieselStoreFrontWide",
    "OfferImageWide",
    "Thumbnail",
    "DieselStoreFrontTall",
    "DieselGameBox",
    "DieselGameBoxTall",
    "VaultClosed",
  ];

  if (Array.isArray(rawKeyImages)) {
    for (const pType of preferred) {
      const found = rawKeyImages.find(
        (img: any) =>
          (img.type === pType || img.imageType === pType) &&
          (img.url || img.link)
      );
      if (found) {
        return found.url || found.link;
      }
    }
    if (rawKeyImages.length > 0 && (rawKeyImages[0].url || rawKeyImages[0].link)) {
      return rawKeyImages[0].url || rawKeyImages[0].link;
    }
  }

  if (customAttributes && typeof customAttributes === "object") {
    for (const key of preferred) {
      const val = customAttributes[key]?.value;
      if (val && typeof val === "string" && val.startsWith("http")) {
        return val;
      }
    }
  }

  return "";
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export async function GET(request: Request) {
  let authUser = null;
  try {
    authUser = await getAuthenticatedUser();
  } catch {}

  const { searchParams } = new URL(request.url);
  const rawUser = searchParams.get("user")?.trim();
  const code = searchParams.get("code")?.trim();

  if (!rawUser && !code) {
    return NextResponse.json(
      {
        error:
          "Paramètre 'user' (pseudo Epic Games) ou 'code' (code d'autorisation Epic) requis.",
      },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  // Mode 1: Authentication via official Epic Games Authorization Code
  if (code) {
    try {
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
            code: code,
            token_type: "eg1",
          }).toString(),
        }
      );

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return NextResponse.json(
          {
            error:
              "Code d'autorisation Epic Games expiré ou invalide. Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
            details: errText,
          },
          { status: 401 }
        );
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const accountId = tokenData.account_id;
      const displayName = tokenData.displayName || rawUser || "Joueur Epic";

      const discoveredGames: OwnedGame[] = [];
      const gameNamespaceMap = new Map<number, string>();
      interface AchSummary {
        sandboxId: string;
        totalUnlocked: number;
        totalAchievements: number;
        totalXP: number;
        gameTitle?: string;
        coverUrl?: string;
        playerAchievements?: any[];
      }
      const achBySandbox = new Map<string, AchSummary>();
      let totalAchievements = 0;
      let completedGames = 0;

      if (accessToken && accountId) {
        // Collect raw items from both library-service and launcher assets
        const rawItems: any[] = [];

        // 1. Query library-service (with cursor pagination)
        try {
          const libraryRes = await fetch(
            "https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent":
                  "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
              },
            }
          );

          if (libraryRes.ok) {
            const libData = await libraryRes.json();
            const records: any[] = Array.isArray(libData)
              ? [...libData]
              : Array.isArray(libData?.records)
              ? [...libData.records]
              : [];

            let nextCursor =
              libData?.responseMetadata?.nextCursor ||
              libData?.nextCursor ||
              libData?.cursor;
            let pageCount = 0;
            const MAX_PAGES = 50; // Safety cap (up to ~2500 games)
            while (nextCursor && pageCount < MAX_PAGES) {
              pageCount++;
              try {
                const cursorParam = nextCursor.includes("%")
                  ? nextCursor
                  : encodeURIComponent(nextCursor);
                let nextRes = await fetch(
                  `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${cursorParam}`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "User-Agent":
                        "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
                    },
                  }
                );

                if (!nextRes.ok && cursorParam !== nextCursor) {
                  nextRes = await fetch(
                    `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&cursor=${nextCursor}`,
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "User-Agent":
                          "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
                      },
                    }
                  );
                }

                if (!nextRes.ok) break;
                const nextData = await nextRes.json();
                const nextRecords = Array.isArray(nextData)
                  ? nextData
                  : Array.isArray(nextData?.records)
                  ? nextData.records
                  : [];
                if (nextRecords.length === 0) break;
                records.push(...nextRecords);
                nextCursor =
                  nextData?.responseMetadata?.nextCursor ||
                  nextData?.nextCursor ||
                  nextData?.cursor;
              } catch {
                break;
              }
            }

            rawItems.push(...records);
          }
        } catch {}

        // 2. Query launcher assets only if library-service returned nothing
        if (rawItems.length === 0) {
          try {
            const assetsRes = await fetch(
              "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "User-Agent":
                    "UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
                },
              }
            );

            if (assetsRes.ok) {
              const assetsData = await assetsRes.json();
              if (Array.isArray(assetsData)) {
                rawItems.push(...assetsData);
              }
            }
          } catch {}
        }

        // 3. Batch query catalog-public-service for real commercial titles and cover images
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

        const catalogTitles = new Map<string, { title: string; image: string }>();
        const nsEntries = Array.from(namespaceMap.entries());
        const BATCH_SIZE = 10;
        for (let i = 0; i < nsEntries.length; i += BATCH_SIZE) {
          const chunk = nsEntries.slice(i, i + BATCH_SIZE);
          await Promise.all(
            chunk.map(async ([ns, ids]) => {
              try {
                const queryIds = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
                const cRes = await fetch(
                  `https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/${ns}/bulk/items?${queryIds}&includeDLCDetails=true&includeMainGameDetails=true&country=FR&locale=fr-FR`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "User-Agent":
                        "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
                    },
                  }
                );
                if (cRes.ok) {
                  const cData = await cRes.json();
                  const items = Array.isArray(cData) ? cData : Object.values(cData);
                  for (const it of items as any[]) {
                    const itId = it?.id;
                    const itTitle = it?.title || it?.name;
                    if (itId && itTitle) {
                      const imgUrl = extractBestCover(it.keyImages, it.customAttributes);
                      catalogTitles.set(itId, { title: itTitle, image: imgUrl });
                    }
                  }
                }
              } catch {}
            })
          );
        }

        // 4. Build unified discoveredGames list (deduplicating across library-service and assets)
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

        // Step 5: Query player achievements from Epic Games Store GraphQL
        try {
          let rawTotalAchievements = 0;
          let rawCompletedGames = 0;

          try {
            const gqlRes = await fetch("https://graphql.epicgames.com/graphql", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
              },
              body: JSON.stringify({
                query: `query PlayerGameAchievementProgress($epicAccountId: String!) {
                  PlayerAchievement {
                    playerAchievementGameRecords(epicAccountId: $epicAccountId, includeAchievements: false) {
                      records {
                        sandboxId
                        totalUnlocked
                        totalXP
                        achievementSets {
                          achievementSetId
                          isBase
                          totalUnlocked
                          totalXP
                        }
                        playerAchievements {
                          playerAchievement {
                            achievementName
                            unlocked
                            XP
                          }
                        }
                      }
                    }
                  }
                }`,
                variables: { epicAccountId: accountId },
              }),
            });

            if (gqlRes.ok) {
              const gqlData = await gqlRes.json();

              // Handle PlayerAchievement records
              const achRecords =
                gqlData?.data?.PlayerAchievement?.playerAchievementGameRecords?.records;

              if (Array.isArray(achRecords)) {
                for (const achRec of achRecords) {
                  const sId = (achRec.sandboxId || "").toLowerCase();
                  if (!sId) continue;
                  const unlocked = achRec.totalUnlocked || 0;
                  rawTotalAchievements += unlocked;

                  const playerAchs = Array.isArray(achRec.playerAchievements)
                    ? achRec.playerAchievements
                    : [];
                  const sets = Array.isArray(achRec.achievementSets) ? achRec.achievementSets : [];

                  let totalInGame = playerAchs.length;
                  if (totalInGame === 0) {
                    totalInGame = Math.max(
                      unlocked,
                      sets.reduce(
                        (acc: number, s: any) =>
                          acc + (s.totalAchievements || s.totalUnlocked || 0),
                        0
                      )
                    );
                  }

                  if (unlocked > 0 && totalInGame > 0 && unlocked >= totalInGame) {
                    rawCompletedGames += 1;
                  }

                  achBySandbox.set(sId, {
                    sandboxId: sId,
                    totalUnlocked: unlocked,
                    totalAchievements: totalInGame,
                    totalXP: achRec.totalXP || 0,
                    playerAchievements: playerAchs,
                  });
                }
              }

              // Also parse PlayerProfile summaries if returned
              const summaries =
                gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries?.data ||
                gqlData?.data?.PlayerProfile?.playerProfile?.achievementsSummaries;
              const sumItems = Array.isArray(summaries)
                ? summaries
                : Array.isArray(summaries?.data)
                ? summaries.data
                : [];

              for (const it of sumItems) {
                const sId = (it.sandboxId || "").toLowerCase();
                if (!sId) continue;
                const unlocked = it.totalUnlocked || 0;
                const total =
                  it.productAchievements?.totalAchievements ||
                  Math.max(unlocked, it.totalAchievements || 0);
                const title = it.product?.name || "";
                const cover = extractBestCover(it.baseOfferForSandbox?.keyImages);

                const existing = achBySandbox.get(sId);
                if (existing) {
                  if (title && !existing.gameTitle) existing.gameTitle = title;
                  if (cover && !existing.coverUrl) existing.coverUrl = cover;
                  if (total > existing.totalAchievements) existing.totalAchievements = total;
                  if (unlocked > existing.totalUnlocked) existing.totalUnlocked = unlocked;
                } else {
                  achBySandbox.set(sId, {
                    sandboxId: sId,
                    totalUnlocked: unlocked,
                    totalAchievements: total,
                    totalXP: it.totalXP || 0,
                    gameTitle: title,
                    coverUrl: cover,
                  });
                }
              }
            }
          } catch {}

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
              if (ach.coverUrl && (!g.headerImg || isUnsplashPlaceholder(g.headerImg))) {
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
                (ach.gameTitle && normalizeTitle(g.name) === normalizeTitle(ach.gameTitle))
              );
            });

            if (!alreadyInGames && ach.totalUnlocked > 0) {
              const gameName = ach.gameTitle || `Epic Game (${sId})`;
              const idNum = Math.abs(hashCode(sId || gameName));
              discoveredGames.push({
                appId: idNum,
                name: gameName,
                headerImg:
                  ach.coverUrl ||
                  DEFAULT_EPIC_COVER,
                platform: "epic",
                totalAchievements: ach.totalAchievements,
                unlockedCount: ach.totalUnlocked,
                addedAt: nowIso,
                source: "manual",
              });
              gameNamespaceMap.set(idNum, sId);
            }
          }

          // If resolveAchievements=1 is requested, resolve missing totalAchievements via Steam schema
          const resolveAchievements =
            searchParams.get("resolveAchievements") === "1";
          if (resolveAchievements && discoveredGames.length > 0) {
            const gamesToEnrich = discoveredGames.filter(
              (g) =>
                (g.totalAchievements || 0) === 0 &&
                g.name &&
                !g.name.startsWith("Epic Game (") &&
                !g.name.startsWith("Jeu Epic (")
            );
            const BATCH_SIZE = 6;
            for (let i = 0; i < gamesToEnrich.length; i += BATCH_SIZE) {
              const batch = gamesToEnrich.slice(i, i + BATCH_SIZE);
              await Promise.all(
                batch.map(async (game) => {
                  try {
                    const rawName = (game.name || "").slice(0, 300);
                    const cleanSearch = rawName
                      .replace(/[®™©]/g, "")
                      .replace(/\([^()]*\)|\[[^[\]]*\]/g, "")
                      .replace(/ - Definitive Edition/gi, "")
                      .replace(/ - Game of the Year Edition/gi, "")
                      .replace(/ - Standard Edition/gi, "")
                      .replace(/ - Complete Edition/gi, "")
                      .replace(/ - Deluxe Edition/gi, "")
                      .replace(/ Enhanced Edition/gi, "")
                      .replace(/ Director's Cut/gi, "")
                      .replace(/\s+/g, " ")
                      .trim();
                    if (!cleanSearch) return;

                    const searchRes = await fetch(
                      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
                        cleanSearch
                      )}&l=french&cc=fr`,
                      {
                        headers: {
                          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                        },
                      }
                    );
                    if (!searchRes.ok) return;
                    const searchData = await searchRes.json();
                    const items: Array<{
                      id?: number;
                      name?: string;
                      tiny_image?: string;
                    }> = Array.isArray(searchData?.items)
                      ? searchData.items
                      : [];
                    if (items.length === 0) return;

                    const targetNorm = normalizeTitle(cleanSearch);
                    const bestItem =
                      items.find(
                        (it) =>
                          it.name && normalizeTitle(it.name) === targetNorm
                      ) ||
                      items.find((it) => {
                        if (!it.name) return false;
                        const itNorm = normalizeTitle(it.name);
                        return (
                          itNorm.startsWith(targetNorm) ||
                          targetNorm.startsWith(itNorm)
                        );
                      }) ||
                      items[0];

                    if (!bestItem?.id) return;
                    const steamAppId = String(bestItem.id);

                    const achRes = await fetch(
                      `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${steamAppId}&language=french`,
                      {
                        headers: {
                          Cookie:
                            "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
                          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                          "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        },
                      }
                    );
                    if (achRes.ok) {
                      const achData = await achRes.json();
                      const achList = achData?.response?.achievements;
                      if (Array.isArray(achList) && achList.length > 0) {
                        game.totalAchievements = achList.length;
                      }
                    }

                    if (
                      isUnsplashPlaceholder(game.headerImg) &&
                      bestItem.tiny_image
                    ) {
                      game.headerImg = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
                    }
                  } catch {}
                })
              );
            }
          }

          // Compute global account achievement stats
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
        } catch {}
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

      if (authUser) {
        try {
          const plainKey = JSON.stringify({
            accessToken,
            refreshToken: tokenData?.refresh_token,
            accountId,
          });
          saveUserPlatformAccount(authUser.id, account, plainKey);
          if (discoveredGames.length > 0) {
            saveUserOwnedGames(authUser.id, discoveredGames);

            for (const g of discoveredGames) {
              if ((g.unlockedCount || 0) > 0) {
                const sId = gameNamespaceMap.get(g.appId)?.toLowerCase();
                const rec = sId ? achBySandbox.get(sId) : null;
                const playerAchs = rec?.playerAchievements || [];
                const unlockedNames = playerAchs
                  .filter((p: any) => p.unlocked)
                  .map((p: any) => p.achievementName);
                const unlockedIds =
                  unlockedNames.length > 0
                    ? unlockedNames.map(
                        (t: string, idx: number) =>
                          `ach_${idx + 1}_${t.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`
                      )
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

      return NextResponse.json({
        success: true,
        account,
        discoveredGames,
      });
    } catch (err: any) {
      console.error("Epic Auth error:", err);
      return NextResponse.json(
        { error: "Impossible de joindre l'API Epic Games.", details: err.message },
        { status: 500 }
      );
    }
  }

  // Mode 2: Username registration without credentials
  const account: PlatformAccount = {
    platform: "epic",
    username: rawUser!,
    displayName: rawUser!,
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

  return NextResponse.json({
    success: true,
    account,
    discoveredGames: [],
    notice:
      "Compte Epic Games configuré. Vous pouvez synchroniser vos jeux avec un code temporaire ou ajouter manuellement vos jeux Epic.",
  });

}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
