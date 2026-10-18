// lib/gog/game-details.services.ts
import type { Achievement, OwnedGame } from "@/lib/types";
import { getUserPlatformAccounts, saveUserGameProgress } from "@/lib/db";
import { parseGogUsername } from "./identifier.services";
import { parseGogGameAchievementsHtml } from "./parser.services";

const DEFAULT_GOG_HEADERS: Readonly<Record<string, string>> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

export async function fetchGogTokenGames(
  headers: Readonly<Record<string, string>>,
  nowIso: string
): Promise<OwnedGame[]> {
  try {
    const libraryRes = await fetch("https://embed.gog.com/user/data/games", {
      headers,
      next: { revalidate: 300 },
    });
    if (!libraryRes.ok) return [];
    const data = (await libraryRes.json()) as { readonly owned?: readonly number[] };
    const ownedIds = Array.isArray(data?.owned) ? data.owned : [];
    return ownedIds.slice(0, 50).map((id) => ({
      appId: id,
      name: `Jeu GOG #${id}`,
      headerImg: `https://images.gog-statics.com/products/${id}/header.jpg`,
      platform: "gog",
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: nowIso,
      source: "manual",
    }));
  } catch (err: unknown) {
    if (err instanceof Error) return [];
    return [];
  }
}

export async function getGogAchievementsForUser(
  userId: string,
  appId: number
): Promise<Achievement[] | null> {
  const accounts = getUserPlatformAccounts(userId);
  const gogUsername = accounts.gog?.username;
  if (!gogUsername) return null;

  try {
    const cleanUser = parseGogUsername(gogUsername);
    const url = `https://www.gog.com/u/${encodeURIComponent(cleanUser)}/game/${appId}`;
    const res = await fetch(url, { headers: DEFAULT_GOG_HEADERS, next: { revalidate: 120 } });
    if (!res.ok) return null;

    const html = await res.text();
    const parsed = parseGogGameAchievementsHtml(html);
    if (parsed.achievements.length === 0) return null;

    saveUserGameProgress(userId, appId, "gog", {
      unlockedIds: parsed.unlockedIds,
      notes: {},
    });

    return parsed.achievements;
  } catch (err: unknown) {
    if (err instanceof Error) return null;
    return null;
  }
}
