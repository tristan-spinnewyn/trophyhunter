// lib/xbox/service.ts

import type { PlatformAccount } from "@/lib/types";
import type { XboxProfileSyncResult } from "./types";
import { parseOpenXblProfile, parseOpenXblTitles } from "./openxbl";

export function buildFallbackXboxAccount(rawUser: string, nowIso = new Date().toISOString()): PlatformAccount {
  return {
    platform: "xbox",
    username: rawUser,
    displayName: rawUser,
    profileUrl: `https://www.xbox.com/fr-FR/play`,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0, gamerScore: 0 },
  };
}

export async function fetchXboxProfileLive(
  rawUser: string,
  apiKey: string,
  nowIso = new Date().toISOString()
): Promise<XboxProfileSyncResult> {
  const headers = {
    "X-Authorization": apiKey,
    Accept: "application/json",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  };

  let xuid = rawUser;
  let gamerTag = rawUser;
  let avatarUrl = "";
  let gamerScore = 0;

  if (!/^\d{15,20}$/.test(rawUser)) {
    const searchRes = await fetch(
      `https://api.xbl.io/v2/friends/search?gt=${encodeURIComponent(rawUser)}`,
      { headers, next: { revalidate: 120 } }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const parsed = parseOpenXblProfile(searchData?.profileUsers?.[0], rawUser);
      xuid = parsed.xuid;
      gamerTag = parsed.gamerTag;
      avatarUrl = parsed.avatarUrl;
      gamerScore = parsed.gamerScore;
    }
  }

  const titleRes = await fetch(
    `https://api.xbl.io/v2/player/title-history/${encodeURIComponent(xuid)}`,
    { headers, next: { revalidate: 120 } }
  );

  let titles = [];
  if (titleRes.ok) {
    const titleData = await titleRes.json();
    titles = Array.isArray(titleData?.titles) ? titleData.titles : [];
  }

  const { discoveredGames, totalAchievements, completedGames } = parseOpenXblTitles(titles, nowIso);

  const account: PlatformAccount = {
    platform: "xbox",
    username: rawUser,
    displayName: gamerTag || rawUser,
    avatarUrl: avatarUrl || undefined,
    profileUrl: `https://www.xbox.com/fr-FR/play`,
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: {
      gamesOwned: Math.max(discoveredGames.length, 0),
      totalAchievements,
      completedGames,
      gamerScore,
    },
  };

  return { account, discoveredGames };
}
