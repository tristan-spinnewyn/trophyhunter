// lib/xbox/service.ts

import type { PlatformAccount } from "@/lib/types";
import {
  type OpenXblProfilePayload,
  type OpenXblTitle,
  type OpenXblTitlesPayload,
  type XboxProfileSyncResult,
  XboxApiError,
} from "./types";
import { parseOpenXblProfile, parseOpenXblTitles, unwrapOpenXblPayload } from "./openxbl";
import { enrichXboxGamesTotals } from "./game-details";

export function buildFallbackXboxAccount(rawUser: string, nowIso = new Date().toISOString()): PlatformAccount {
  return {
    platform: "xbox",
    username: rawUser,
    displayName: rawUser,
    profileUrl: "https://www.xbox.com/fr-FR/play",
    connectedAt: nowIso,
    lastSyncedAt: nowIso,
    stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0, gamerScore: 0 },
  };
}

async function fetchOpenXblJson<T>(url: string, headers: Record<string, string>): Promise<T | null> {
  const res = await fetch(url, { headers, next: { revalidate: 120 } });
  if (res.status === 401 || res.status === 403) {
    throw new XboxApiError("Clé API OpenXBL invalide ou expirée (xbl.io).", 401);
  }
  if (res.status === 429) {
    throw new XboxApiError("Limite de requêtes OpenXBL atteinte (429). Réessayez dans une minute.", 429);
  }
  if (!res.ok) return null;
  return unwrapOpenXblPayload<T>(await res.json());
}

async function fetchPlayerTitles(xuid: string, headers: Record<string, string>): Promise<readonly OpenXblTitle[]> {
  const urls = [
    `https://api.xbl.io/v2/titles/${encodeURIComponent(xuid)}`,
    `https://api.xbl.io/v2/achievements/player/${encodeURIComponent(xuid)}`,
    "https://api.xbl.io/v2/titles",
  ];
  for (const url of urls) {
    const payload = await fetchOpenXblJson<OpenXblTitlesPayload>(url, headers);
    if (Array.isArray(payload?.titles) && payload.titles.length > 0) return payload.titles;
  }
  return [];
}

export async function fetchXboxProfileLive(
  rawUser: string,
  apiKey: string,
  nowIso = new Date().toISOString()
): Promise<XboxProfileSyncResult> {
  const headers: Record<string, string> = {
    "X-Authorization": apiKey.trim(),
    Accept: "application/json",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  };

  let xuid = rawUser;
  let gamerTag = rawUser;
  let avatarUrl = "";
  let gamerScore = 0;

  if (!/^\d{15,20}$/.test(rawUser)) {
    const cleanGt = rawUser.replace(/#/, "");
    const search = await fetchOpenXblJson<OpenXblProfilePayload>(
      `https://api.xbl.io/v2/friends/search?gt=${encodeURIComponent(cleanGt)}`,
      headers
    );
    let profile = search?.profileUsers?.[0];
    let person = search?.people?.[0];
    if (!profile?.id && !person?.xuid) {
      const self = await fetchOpenXblJson<OpenXblProfilePayload>("https://api.xbl.io/v2/account", headers);
      profile = self?.profileUsers?.[0];
      person = self?.people?.[0];
    }
    const parsed = parseOpenXblProfile(profile, rawUser, person);
    xuid = parsed.xuid;
    gamerTag = parsed.gamerTag;
    avatarUrl = parsed.avatarUrl;
    gamerScore = parsed.gamerScore;
  }

  const titles = await fetchPlayerTitles(xuid, headers);
  const { discoveredGames, totalAchievements, completedGames, titlesGamerScore } = parseOpenXblTitles(titles, nowIso);
  await enrichXboxGamesTotals(discoveredGames, titles, xuid, headers);

  return {
    account: {
      platform: "xbox",
      username: rawUser,
      displayName: gamerTag || rawUser,
      avatarUrl: avatarUrl || undefined,
      profileUrl: "https://www.xbox.com/fr-FR/play",
      connectedAt: nowIso,
      lastSyncedAt: nowIso,
      stats: {
        gamesOwned: Math.max(discoveredGames.length, 0),
        totalAchievements,
        completedGames,
        gamerScore: gamerScore || titlesGamerScore,
      },
    },
    discoveredGames,
  };
}
