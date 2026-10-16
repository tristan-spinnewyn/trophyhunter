// lib/epic/enrichment-matcher.ts
import { normalizeTitle } from "./helpers";

export async function searchSteamMetadataForTitle(cleanSearch: string): Promise<{
  steamAppId?: string;
  tinyImage?: string;
  totalAchievements?: number;
}> {
  try {
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanSearch)}&l=french&cc=fr`,
      { headers: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" } }
    );
    if (!searchRes.ok) return {};
    const searchData = await searchRes.json();
    const items: Array<{ id?: number; name?: string; tiny_image?: string }> =
      Array.isArray(searchData?.items) ? searchData.items : [];
    if (items.length === 0) return {};

    const targetNorm = normalizeTitle(cleanSearch);
    const bestItem =
      items.find((it) => it.name && normalizeTitle(it.name) === targetNorm) ||
      items.find((it) => {
        if (!it.name) return false;
        const itNorm = normalizeTitle(it.name);
        return itNorm.startsWith(targetNorm) || targetNorm.startsWith(itNorm);
      }) ||
      items[0];

    if (!bestItem?.id) return {};
    const steamAppId = String(bestItem.id);

    let totalAchievements: number | undefined;
    const achRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?appid=${steamAppId}&language=french`,
      {
        headers: {
          Cookie: "Steam_Language=french; mature_content=1; birthtime=568022401; lastagecheckage=1-January-1990",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );
    if (achRes.ok) {
      const achData = await achRes.json();
      const achList = achData?.response?.achievements;
      if (Array.isArray(achList) && achList.length > 0) totalAchievements = achList.length;
    }

    return { steamAppId, tinyImage: bestItem.tiny_image, totalAchievements };
  } catch {
    return {};
  }
}
