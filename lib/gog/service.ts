// lib/gog/service.ts

import type { OwnedGame, PlatformAccount } from "@/lib/types";

export interface GogSyncResult {
  account: PlatformAccount;
  discoveredGames: OwnedGame[];
}

export function parseGogProfileHtml(html: string): { avatarUrl: string; gamesOwned: number } {
  let avatarUrl = "";
  let gamesOwned = 0;

  const avatarMatch =
    html.match(/class="user-avatar[^"]*"[^>]*src="([^"]+)"/i) ||
    html.match(/class="avatar"[^>]*src="([^"]+)"/i);
  if (avatarMatch) {
    avatarUrl = avatarMatch[1].startsWith("//") ? `https:${avatarMatch[1]}` : avatarMatch[1];
  }

  const gamesMatch = html.match(/class="user-stats__item-count">\s*(\d+)/);
  if (gamesMatch) {
    gamesOwned = parseInt(gamesMatch[1], 10) || 0;
  }

  return { avatarUrl, gamesOwned };
}

export async function fetchGogProfile(
  rawUser: string,
  token?: string,
  nowIso = new Date().toISOString()
): Promise<GogSyncResult> {
  const baseUrl = `https://www.gog.com/u/${encodeURIComponent(rawUser)}`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const profileRes = await fetch(baseUrl, { headers, next: { revalidate: 120 } });
  let avatarUrl = "";
  let gamesOwned = 0;
  const discoveredGames: OwnedGame[] = [];

  if (profileRes.ok) {
    const html = await profileRes.text();
    const parsed = parseGogProfileHtml(html);
    avatarUrl = parsed.avatarUrl;
    gamesOwned = parsed.gamesOwned;
  }

  if (token) {
    try {
      const libraryRes = await fetch("https://embed.gog.com/user/data/games", {
        headers,
        next: { revalidate: 300 },
      });
      if (libraryRes.ok) {
        const data = await libraryRes.json();
        const ownedIds: number[] = Array.isArray(data?.owned) ? data.owned : [];
        gamesOwned = Math.max(gamesOwned, ownedIds.length);

        for (const id of ownedIds.slice(0, 50)) {
          discoveredGames.push({
            appId: id,
            name: `Jeu GOG #${id}`,
            headerImg: `https://images.gog-statics.com/products/${id}/header.jpg`,
            platform: "gog",
            totalAchievements: 0,
            unlockedCount: 0,
            addedAt: nowIso,
            source: "manual",
          });
        }
      }
    } catch {}
  }

  const account: PlatformAccount = {
    platform: "gog",
    username: rawUser,
    displayName: rawUser,
    avatarUrl: avatarUrl || undefined,
    profileUrl: baseUrl,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: Math.max(gamesOwned, discoveredGames.length),
      totalAchievements: 0,
      completedGames: 0,
    },
  };

  return { account, discoveredGames };
}
