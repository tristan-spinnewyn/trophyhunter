import type { DiscoveredGameData } from "./types";

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
