import type { OwnedGame } from "@/lib/types";
import { normalizeTitle } from "./helpers";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

export async function enrichEpicGamesWithSteamMetadata(
  games: OwnedGame[]
): Promise<void> {
  const gamesToEnrich = games.filter(
    (g) =>
      g.totalAchievements === 0 &&
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
          }> = Array.isArray(searchData?.items) ? searchData.items : [];
          if (items.length === 0) return;

          const targetNorm = normalizeTitle(cleanSearch);
          const bestItem =
            items.find(
              (it) => it.name && normalizeTitle(it.name) === targetNorm
            ) ||
            items.find((it) => {
              if (!it.name) return false;
              const itNorm = normalizeTitle(it.name);
              return (
                itNorm.startsWith(targetNorm) || targetNorm.startsWith(itNorm)
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
