import { NextResponse } from "next/server";
import type { Achievement, GameDetails } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Heuristic keywords that often indicate missable/challenging trophies
const MISSABLE_KEYWORDS = [
  "sans mourir",
  "en moins de",
  "chronométré",
  "choix",
  "décision",
  "toutes les fins",
  "fin secrète",
  "manquable",
  "rater",
  "speedrun",
  "sans utiliser",
  "sans tuer",
  "discrétion",
  "100%",
  "tous les collectibles",
  "tous les objets",
  "difficulté maximale",
  "en une seule partie",
];

function isLikelyMissable(title: string, desc: string): boolean {
  const combined = `${title} ${desc}`.toLowerCase();
  return MISSABLE_KEYWORDS.some((kw) => combined.includes(kw));
}

// Clean game titles for better external search (e.g., removing "(TM)", "®", "Game of the Year", etc.)
function cleanTitleForSearch(title: string): string {
  return title
    .replace(/[®™©]/g, "")
    .replace(/(\(.*?\)|\[.*?\])/g, "")
    .replace(/ - Definitive Edition/gi, "")
    .replace(/ - Game of the Year Edition/gi, "")
    .replace(/ - Standard Edition/gi, "")
    .replace(/ - Complete Edition/gi, "")
    .replace(/ - Deluxe Edition/gi, "")
    .replace(/ Enhanced Edition/gi, "")
    .replace(/ Director's Cut/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForComparison(title: string): string {
  return cleanTitleForSearch(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findBestSteamMatch(
  items: Array<{ id?: number; name?: string }>,
  targetName: string
): { id?: number; name?: string } | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const targetNorm = normalizeForComparison(targetName);
  if (targetNorm) {
    const exact = items.find(
      (it) => it.name && normalizeForComparison(it.name) === targetNorm
    );
    if (exact) return exact;
    const startsWith = items.find((it) => {
      if (!it.name) return false;
      const itemNorm = normalizeForComparison(it.name);
      return itemNorm.startsWith(targetNorm) || targetNorm.startsWith(itemNorm);
    });
    if (startsWith) return startsWith;
  }
  return items[0];
}

// Safely sanitize HTML tags iteratively to prevent incomplete multi-character sanitization
function stripHtmlTags(input: string): string {
  let prev = input;
  let curr = input;
  do {
    prev = curr;
    curr = curr.replace(/<[^>]*>/g, "");
  } while (curr !== prev);
  return curr.trim();
}

async function fetchSteamAchievementsByAppId(steamAppId: string) {
  try {
    const r = await fetch(
      `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${steamAppId}&language=french`,
      {
        headers: {
          Cookie:
            "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 600 },
      }
    );
    if (!r.ok) return null;
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json?.response?.achievements)) {
        return { type: "schema" as const, list: json.response.achievements };
      }
    } catch {
      // text is HTML (e.g. from unit test mock or legacy endpoint)
    }
    return { type: "html" as const, html: text };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appId = id?.trim();

  if (!appId || !/^\d+$/.test(appId)) {
    return NextResponse.json({ error: "AppID Steam invalide." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const nameParam = searchParams.get("name")?.trim();
    const fastMode = searchParams.get("fast") === "1";

    let achResult:
      | { type: "schema"; list: any[] }
      | { type: "html"; html: string }
      | null = null;
    let gameInfo: any = null;
    let effectiveAppId = appId;
    let matchedSearchImage = "";

    if (!fastMode || !nameParam) {
      // 1. Fetch Store details (Game name, image, description)
      const storePromise = fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&l=french&cc=fr`,
        {
          headers: {
            "Accept-Language": "fr-FR,fr;q=0.9",
          },
          next: { revalidate: 3600 }, // 1 hour cache
        }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // 2. Fetch Achievements (Schema JSON or HTML fallback)
      const achPromise = fetchSteamAchievementsByAppId(appId);

      const [storeData, initialAchResult] = await Promise.all([
        storePromise,
        achPromise,
      ]);
      achResult = initialAchResult;
      gameInfo = storeData?.[appId]?.data;
    }

    // If game was not found directly by appId (e.g. non-Steam appId from Epic, GOG, or Xbox),
    // search Steam by name to resolve its French achievement checklist!
    if (!gameInfo && nameParam) {
      try {
        const cleanSearchName = cleanTitleForSearch(nameParam);
        const searchRes = await fetch(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
            cleanSearchName || nameParam
          )}&l=french&cc=fr`,
          {
            headers: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" },
          }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const bestMatch = findBestSteamMatch(
            searchData?.items || [],
            cleanSearchName || nameParam
          ) as { id?: number; name?: string; tiny_image?: string } | undefined;

          if (bestMatch?.id) {
            effectiveAppId = String(bestMatch.id);
            if (bestMatch.tiny_image) {
              matchedSearchImage = bestMatch.tiny_image;
            }

            if (fastMode) {
              const matchedAchRes = await fetchSteamAchievementsByAppId(
                effectiveAppId
              );
              if (matchedAchRes) {
                achResult = matchedAchRes;
              }
            } else {
              const [matchedStoreRes, matchedAchRes] = await Promise.all([
                fetch(
                  `https://store.steampowered.com/api/appdetails?appids=${effectiveAppId}&l=french&cc=fr`,
                  {
                    headers: { "Accept-Language": "fr-FR,fr;q=0.9" },
                    next: { revalidate: 3600 },
                  }
                )
                  .then((r) => (r.ok ? r.json() : null))
                  .catch(() => null),
                fetchSteamAchievementsByAppId(effectiveAppId),
              ]);

              if (matchedStoreRes?.[effectiveAppId]?.data) {
                gameInfo = matchedStoreRes[effectiveAppId].data;
              }
              if (matchedAchRes) {
                achResult = matchedAchRes;
              }
            }
          }
        }
      } catch (searchErr) {
        console.warn("Failed to search Steam fallback:", searchErr);
      }
    }

    const gameName = gameInfo?.name || nameParam || `Jeu (#${appId})`;
    const headerImg =
      gameInfo?.header_image ||
      matchedSearchImage ||
      `https://cdn.akamai.steamstatic.com/steam/apps/${effectiveAppId}/header.jpg`;
    const shortDesc = gameInfo?.short_description || "";
    const developers = gameInfo?.developers || [];
    const publishers = gameInfo?.publishers || [];

    // Parse achievements
    const achievements: Achievement[] = [];

    if (achResult?.type === "schema" && achResult.list.length > 0) {
      const officialList = achResult.list;
      for (let i = 0; i < officialList.length; i++) {
        const item = officialList[i];
        const title = item.localized_name || item.internal_name || `Succès #${i + 1}`;
        const rawDesc = item.localized_desc || "";
        const isHidden = !!item.hidden;
        const displayDesc = rawDesc || (isHidden ? "Succès secret (Masqué par le jeu)" : "");
        const percent = parseFloat(item.player_percent_unlocked) || 0;
        const icon = item.icon
          ? (item.icon.startsWith("http")
              ? item.icon
              : `https://shared.fastly.steamstatic.com/community_assets/images/apps/${effectiveAppId}/${item.icon}`)
          : "";
        const missable = isLikelyMissable(title, displayDesc);
        const idSlug = `ach_${i + 1}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

        achievements.push({
          id: idSlug,
          name: title,
          desc: displayDesc,
          icon,
          percent,
          hidden: isHidden,
          missable,
        });
      }
    } else if (achResult?.type === "html" && achResult.html) {
      // Fallback parser for legacy HTML / mock test environments
      const parts = achResult.html.split(/<div[^>]*class="[^"]*achieveRow[^"]*"[^>]*>/);
      for (let i = 1; i < parts.length; i++) {
        const block = parts[i];

        const imgMatch = block.match(/<img[^>]*src="([^"]+)"/);
        const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/);
        const descMatch = block.match(/<h5[^>]*>(.*?)<\/h5>/);
        const percentMatch = block.match(/<div class="achievePercent">([^<]+)<\/div>/);

        const title = titleMatch ? stripHtmlTags(titleMatch[1]) : `Succès #${i}`;
        const rawDesc = descMatch ? stripHtmlTags(descMatch[1]) : "";
        const percentStr = percentMatch ? percentMatch[1].replace("%", "").trim() : "0";
        const percent = parseFloat(percentStr) || 0;
        const icon = imgMatch ? imgMatch[1] : "";

        const isHidden = !rawDesc || rawDesc.length === 0;
        const displayDesc = isHidden ? "Succès secret (Masqué par le jeu)" : rawDesc;
        const missable = isLikelyMissable(title, displayDesc);
        const idSlug = `ach_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`;

        achievements.push({
          id: idSlug,
          name: title,
          desc: displayDesc,
          icon,
          percent,
          hidden: isHidden,
          missable,
        });
      }
    }

    // Automatically persist resolved totalAchievements in SQLite if user is authenticated
    if (achievements.length > 0) {
      try {
        const authUser = await getAuthenticatedUser();
        if (authUser) {
          const db = getDb();
          db.prepare(
            `UPDATE user_games
             SET total_achievements = ?
             WHERE user_id = ? AND app_id = ?`
          ).run(achievements.length, authUser.id, parseInt(appId, 10));
        }
      } catch {
        // Non-blocking DB update
      }
    }

    const cleanName = cleanTitleForSearch(gameName);

    const gameDetails: GameDetails = {
      id: parseInt(appId, 10),
      name: gameName,
      headerImg,
      shortDesc,
      developers,
      publishers,
      totalAchievements: achievements.length,
      achievements,
      guideLinks: {
        steamGuidesUrl: effectiveAppId
          ? `https://steamcommunity.com/app/${effectiveAppId}/guides/?requiredtags[]=Achievements`
          : "",
        psthcUrl: `https://www.psthc.fr/recherche.html?q=${encodeURIComponent(cleanName)}`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanName + " succes trophée fr")}`,
      },
    };

    return NextResponse.json(gameDetails);
  } catch (error: any) {
    console.error("Game API error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du jeu.", details: error.message },
      { status: 500 }
    );
  }
}

