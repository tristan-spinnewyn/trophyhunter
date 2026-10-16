// lib/epic/enrichment.ts
import type { OwnedGame } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";
import { searchSteamMetadataForTitle } from "./enrichment-matcher";

export async function enrichEpicGamesWithSteamMetadata(games: OwnedGame[]): Promise<void> {
  const gamesToEnrich = games.filter(
    (g) => g.totalAchievements === 0 && !g.name.startsWith("Epic Game (") && !g.name.startsWith("Jeu Epic (")
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

          const meta = await searchSteamMetadataForTitle(cleanSearch);
          if (meta.totalAchievements) {
            game.totalAchievements = meta.totalAchievements;
          }
          if (isUnsplashPlaceholder(game.headerImg) && meta.tinyImage && meta.steamAppId) {
            game.headerImg = `https://cdn.akamai.steamstatic.com/steam/apps/${meta.steamAppId}/header.jpg`;
          }
        } catch {}
      })
    );
  }
}
