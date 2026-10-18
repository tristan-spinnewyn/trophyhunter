// lib/gog/service.ts
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { GogSyncError, type GogSyncResult } from "./gog.types";
import { parseGogUsername } from "./identifier.services";
import { parseGogProfileHtml } from "./parser.services";
import { fetchGogPublicGames } from "./games.services";
import { fetchGogTokenGames, getGogAchievementsForUser } from "./game-details.services";

export { GogSyncError, parseGogProfileHtml, parseGogUsername, getGogAchievementsForUser };
export type { GogSyncResult };

export async function fetchGogProfile(
  rawUser: string,
  token?: string,
  nowIso = new Date().toISOString()
): Promise<GogSyncResult> {
  const username = parseGogUsername(rawUser);
  const baseUrl = `https://www.gog.com/u/${encodeURIComponent(username)}`;
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const profileRes = await fetch(baseUrl, { headers, next: { revalidate: 120 } });
  if (!profileRes.ok) {
    throw new GogSyncError(
      profileRes.status === 404
        ? `Profil GOG "${username}" introuvable ou privé.`
        : `Erreur GOG HTTP ${profileRes.status}.`,
      profileRes.status === 404 ? 404 : 502
    );
  }

  const html = await profileRes.text();
  const parsed = parseGogProfileHtml(html, username);
  const displayUsername = parsed.username || username;

  const discoveredGames: OwnedGame[] = [];
  let gameProgress: Record<number, readonly string[]> = {};
  let completedGamesCount = 0;

  if (parsed.userId || parsed.recentGames.length > 0 || !token) {
    const publicGamesResult = await fetchGogPublicGames(
      displayUsername,
      parsed.userId,
      headers,
      nowIso,
      parsed.recentGames
    );
    discoveredGames.push(...publicGamesResult.games);
    gameProgress = publicGamesResult.gameProgress;
    completedGamesCount = publicGamesResult.completedGamesCount;
  }

  if (token && discoveredGames.length === 0) {
    const tokenGames = await fetchGogTokenGames(headers, nowIso);
    discoveredGames.push(...tokenGames);
  }

  const totalUnlockedSum = Object.values(gameProgress).reduce(
    (acc, ids) => acc + ids.length,
    0
  );

  const account: PlatformAccount = {
    platform: "gog",
    username: displayUsername,
    displayName: displayUsername,
    avatarUrl: parsed.avatarUrl || undefined,
    profileUrl: `https://www.gog.com/u/${encodeURIComponent(displayUsername)}`,
    memberSince: parsed.memberSince,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: Math.max(parsed.gamesOwned, discoveredGames.length),
      totalAchievements: Math.max(parsed.totalAchievements, totalUnlockedSum),
      completedGames: completedGamesCount,
      hoursPlayed: parsed.hoursPlayed || undefined,
    },
  };

  return { account, discoveredGames, gameProgress };
}
