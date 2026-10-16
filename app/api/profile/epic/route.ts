import { NextResponse } from "next/server";
import type { OwnedGame, PlatformAccount } from "@/lib/types";

const EPIC_CLIENT_ID = "34a02cf8f4414e29b15921876da36f9a";
const EPIC_CLIENT_SECRET = "daafbccc737745039dffe53d94fc76cf";
const EPIC_BASIC_AUTH = Buffer.from(
  `${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`
).toString("base64");

function isJunkHex(str: string): boolean {
  return /^[0-9a-f]{20,}$/i.test(str.trim());
}

export async function GET(request: Request) {
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
      let totalAchievements = 0;
      let completedGames = 0;

      if (accessToken && accountId) {
        // Step 1: Query official Epic Library service for user's real game inventory
        try {
          const libraryRes = await fetch(
            "https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent":
                  "EpicGamesLauncher/11.0.1.-28318625+++Portal+Release-Live Windows/10.0.19041.1.256.64bit",
              },
            }
          );

          if (libraryRes.ok) {
            const libData = await libraryRes.json();
            const records: any[] = Array.isArray(libData)
              ? libData
              : Array.isArray(libData?.records)
              ? libData.records
              : [];

            for (const item of records) {
              const appName = item.appName || "";
              const meta = item.metadata || {};

              // Skip Unreal Engine items, prerequisites, tools, and background services
              if (
                appName.startsWith("UE_") ||
                appName.includes("Prerequisites") ||
                item.recordType === "OTHERS" ||
                meta.mainGameItem === false
              ) {
                continue;
              }

              // Extract real commercial title
              let gameTitle =
                meta.title ||
                meta.itemName ||
                item.title ||
                item.name ||
                "";

              if (!gameTitle && appName && !isJunkHex(appName)) {
                gameTitle = appName.replace(/([A-Z])/g, " $1").trim();
              }

              // Skip raw hex hashes with no resolved name
              if (!gameTitle || isJunkHex(gameTitle)) {
                continue;
              }

              // Extract best cover image from keyImages
              let coverUrl = "";
              if (Array.isArray(meta.keyImages)) {
                const preferred = [
                  "DieselStoreFrontWide",
                  "OfferImageWide",
                  "Thumbnail",
                  "DieselStoreFrontTall",
                  "VaultClosed",
                ];
                for (const pType of preferred) {
                  const found = meta.keyImages.find(
                    (img: any) => img.type === pType && img.url
                  );
                  if (found) {
                    coverUrl = found.url;
                    break;
                  }
                }
                if (!coverUrl && meta.keyImages.length > 0 && meta.keyImages[0].url) {
                  coverUrl = meta.keyImages[0].url;
                }
              }

              if (!coverUrl) {
                coverUrl =
                  item.headerImg ||
                  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80";
              }

              const idNum = Math.abs(
                hashCode(item.catalogItemId || appName || gameTitle)
              );

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
          }
        } catch {
          // Fallback if library service fails
        }

        // Step 2: Fallback to launcher assets if library service returned nothing
        if (discoveredGames.length === 0) {
          try {
            const assetsRes = await fetch(
              "https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (assetsRes.ok) {
              const assets = await assetsRes.json();
              if (Array.isArray(assets)) {
                // Collect namespaces for hex-named items to resolve commercial title
                const namespaceMap = new Map<string, string[]>();
                for (const a of assets) {
                  if (!a.appName || a.appName.startsWith("UE_") || a.appName.includes("Prerequisites")) continue;
                  if (a.namespace && a.catalogItemId && isJunkHex(a.appName)) {
                    const list = namespaceMap.get(a.namespace) || [];
                    if (list.length < 50 && !list.includes(a.catalogItemId)) {
                      list.push(a.catalogItemId);
                      namespaceMap.set(a.namespace, list);
                    }
                  }
                }

                const catalogTitles = new Map<string, { title: string; image: string }>();
                const nsEntries = Array.from(namespaceMap.entries()).slice(0, 5);
                await Promise.all(
                  nsEntries.map(async ([ns, ids]) => {
                    try {
                      const queryIds = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
                      const cRes = await fetch(
                        `https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/${ns}/bulk/items?${queryIds}&locale=fr-FR`,
                        {
                          headers: { Authorization: `Bearer ${accessToken}` },
                        }
                      );
                      if (cRes.ok) {
                        const cData = await cRes.json();
                        const items = Array.isArray(cData) ? cData : Object.values(cData);
                        for (const it of items as any[]) {
                          if (it?.id && it?.title) {
                            let imgUrl = "";
                            if (Array.isArray(it.keyImages)) {
                              const found = it.keyImages.find(
                                (im: any) =>
                                  (im.type === "DieselStoreFrontWide" ||
                                    im.type === "OfferImageWide" ||
                                    im.type === "Thumbnail") &&
                                  im.url
                              );
                              imgUrl = found?.url || it.keyImages[0]?.url || "";
                            }
                            catalogTitles.set(it.id, { title: it.title, image: imgUrl });
                          }
                        }
                      }
                    } catch {}
                  })
                );

                for (const asset of assets) {
                  if (!asset.appName || asset.appName.startsWith("UE_") || asset.appName.includes("Prerequisites")) continue;

                  let cleanName = "";
                  let cover = "";

                  if (asset.catalogItemId && catalogTitles.has(asset.catalogItemId)) {
                    const resolved = catalogTitles.get(asset.catalogItemId)!;
                    cleanName = resolved.title;
                    cover = resolved.image;
                  }

                  if (!cleanName) {
                    if (isJunkHex(asset.appName)) {
                      continue; // Skip headless build hashes that cannot be resolved
                    }
                    cleanName = asset.appName.replace(/([A-Z])/g, " $1").trim();
                  }

                  const idNum = Math.abs(hashCode(asset.appName));
                  discoveredGames.push({
                    appId: idNum,
                    name: cleanName,
                    headerImg:
                      cover ||
                      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
                    platform: "epic",
                    totalAchievements: 0,
                    unlockedCount: 0,
                    addedAt: nowIso,
                    source: "manual",
                  });
                }
              }
            }
          } catch {}
        }

        // Step 3: Fetch player achievement records via Epic GraphQL
        try {
          const gqlRes = await fetch("https://graphql.epicgames.com/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              query: `query PlayerGameAchievementProgress($epicAccountId: String!) {
                PlayerAchievement {
                  playerAchievementGameRecords(epicAccountId: $epicAccountId, includeAchievements: false) {
                    records {
                      sandboxId
                      totalUnlocked
                      achievementSets {
                        isBase
                        totalUnlocked
                        totalXP
                      }
                    }
                  }
                }
              }`,
              variables: { epicAccountId: accountId },
            }),
          });

          if (gqlRes?.ok) {
            const gqlData = await gqlRes.json();
            const achRecords =
              gqlData?.data?.PlayerAchievement?.playerAchievementGameRecords?.records;

            if (Array.isArray(achRecords) && achRecords.length > 0) {
              for (const achRec of achRecords) {
                const unlocked = achRec.totalUnlocked || 0;
                totalAchievements += unlocked;

                const sets = achRec.achievementSets || [];
                const totalInSets = sets.reduce(
                  (acc: number, s: any) => acc + (s.totalUnlocked || 0),
                  0
                );
                if (unlocked > 0 && totalInSets > 0 && unlocked >= totalInSets) {
                  completedGames += 1;
                }
              }
            }
          }
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
