// lib/steam/store-api.ts
// HTTP calls to the Steam Web API and store search.
import { cleanTitleForSearch, findBestSteamMatch } from "./game-metadata";
import type { DiscoveredGameData } from "./types";

export type AchFetchResult =
  | { type: "schema"; list: any[] }
  | { type: "html"; html: string }
  | null;

export async function fetchSteamAchievementsByAppId(steamAppId: string): Promise<AchFetchResult> {
  try {
    const r = await fetch(
      `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${steamAppId}&language=french`,
      {
        headers: {
          Cookie: "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 600 },
      }
    );
    if (!r.ok) return null;
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json?.response?.achievements)) {
        return { type: "schema", list: json.response.achievements };
      }
    } catch {}
    return { type: "html", html: text };
  } catch {
    return null;
  }
}

export async function searchSteamStoreFallback(nameParam: string, fastMode = false): Promise<{
  matchedAppId?: string;
  matchedImage?: string;
  gameInfo?: any;
  achResult?: AchFetchResult;
}> {
  try {
    const cleanSearchName = cleanTitleForSearch(nameParam);
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanSearchName || nameParam)}&l=french&cc=fr`,
      { headers: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" } }
    );
    if (!searchRes.ok) return {};
    const searchData = await searchRes.json();
    const bestMatch = findBestSteamMatch(searchData?.items || [], cleanSearchName || nameParam) as
      | { id?: number; name?: string; tiny_image?: string }
      | undefined;

    if (!bestMatch?.id) return {};
    const effectiveAppId = String(bestMatch.id);

    if (fastMode) {
      const achResult = await fetchSteamAchievementsByAppId(effectiveAppId);
      return {
        matchedAppId: effectiveAppId,
        matchedImage: bestMatch.tiny_image,
        achResult: achResult || undefined,
      };
    }

    const [storeRes, achResult] = await Promise.all([
      fetch(`https://store.steampowered.com/api/appdetails?appids=${effectiveAppId}&l=french&cc=fr`, {
        headers: { "Accept-Language": "fr-FR,fr;q=0.9" },
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchSteamAchievementsByAppId(effectiveAppId),
    ]);

    return {
      matchedAppId: effectiveAppId,
      matchedImage: bestMatch.tiny_image,
      gameInfo: storeRes?.[effectiveAppId]?.data,
      achResult: achResult || undefined,
    };
  } catch {
    return {};
  }
}

export async function fetchOwnedGamesFromSteamApi(
  apiKey: string,
  steamId64: string,
  upsert: (appId: number, data: Partial<DiscoveredGameData>) => void
): Promise<number> {
  if (!apiKey || !steamId64) return 0;
  try {
    const ownedRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
        apiKey
      )}&steamid=${encodeURIComponent(
        steamId64
      )}&include_appinfo=1&include_played_free_games=1`,
      { next: { revalidate: 300 } }
    );
    if (!ownedRes.ok) return 0;
    const ownedData = await ownedRes.json();
    const gameList = ownedData?.response?.games;
    if (Array.isArray(gameList)) {
      for (const g of gameList) {
        if (g.appid) {
          upsert(g.appid, {
            name: g.name,
            playtimeHours: g.playtime_forever
              ? Math.round((g.playtime_forever / 60) * 10) / 10
              : 0,
          });
        }
      }
      return ownedData.response.game_count || gameList.length;
    }
  } catch {
    // Continue gracefully if Steam API request fails
  }
  return 0;
}

export async function resolveMissingGameNamesViaStore(
  entries: DiscoveredGameData[]
): Promise<void> {
  const missing = entries.filter((g) => !g.name);
  if (missing.length === 0) return;

  await Promise.all(
    missing.map(async (entry) => {
      try {
        const r = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${entry.appId}&l=french&cc=fr`,
          { next: { revalidate: 86400 } }
        );
        if (r.ok) {
          const d = await r.json();
          const info = d?.[entry.appId]?.data;
          if (info?.name) {
            entry.name = info.name;
          }
          if (info?.achievements?.total && !entry.totalAchievements) {
            entry.totalAchievements = info.achievements.total;
          }
        }
      } catch {
        // Ignore individual store lookup error
      }
    })
  );
}
