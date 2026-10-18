// lib/gog/parser.services.ts
import type { Achievement } from "@/lib/types";
import type {
  GogParsedGameAchievements,
  GogParsedProfile,
  GogProfileUserPayload,
  GogPublicGameItem,
  GogRawAchievementEntry,
} from "./gog.types";
import { normalizeGogImageUrl } from "./identifier.services";

function parseJsonAssignment<T>(html: string, variableName: string): T | null {
  const regex = new RegExp(`window\\.profilesData\\.${variableName}\\s*=\\s*([^\\n]+?);`);
  const match = html.match(regex);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

export function parseGogProfileHtml(html: string, fallbackUsername = ""): GogParsedProfile {
  const profileUser = parseJsonAssignment<GogProfileUserPayload>(html, "profileUser");
  const recentGames = parseJsonAssignment<readonly GogPublicGameItem[]>(html, "recentGames") ?? [];

  if (profileUser) {
    const rawAvatar =
      profileUser.avatars?.large_2x ||
      profileUser.avatars?.large ||
      profileUser.avatars?.medium_2x ||
      profileUser.avatar ||
      "";
    return {
      userId: profileUser.userId || "",
      username: profileUser.username || fallbackUsername,
      avatarUrl: normalizeGogImageUrl(rawAvatar),
      gamesOwned: Number(profileUser.stats?.games_owned ?? 0) || 0,
      totalAchievements: Number(profileUser.stats?.achievements ?? 0) || 0,
      hoursPlayed: Number(profileUser.stats?.hours_played ?? 0) || 0,
      memberSince: profileUser.created_date,
      recentGames,
    };
  }

  const avatarMatch =
    html.match(/class="user-avatar[^"]*"[^>]*src="([^"]+)"/i) ||
    html.match(/class="avatar"[^>]*src="([^"]+)"/i);
  const gamesMatch = html.match(/class="user-stats__item-count">\s*(\d+)/);

  return {
    userId: "",
    username: fallbackUsername,
    avatarUrl: avatarMatch ? normalizeGogImageUrl(avatarMatch[1]) : "",
    gamesOwned: gamesMatch ? parseInt(gamesMatch[1], 10) || 0 : 0,
    totalAchievements: 0,
    hoursPlayed: 0,
    recentGames,
  };
}

export function parseGogGameAchievementsHtml(
  html: string,
  knownUserId?: string
): GogParsedGameAchievements {
  const profileUser = parseJsonAssignment<GogProfileUserPayload>(html, "profileUser");
  const targetUserId = knownUserId || profileUser?.userId || "";
  const rawList = parseJsonAssignment<readonly GogRawAchievementEntry[]>(html, "achievements") ?? [];

  const achievements: Achievement[] = [];
  const unlockedIds: string[] = [];

  for (const item of rawList) {
    const ach = item.achievement;
    if (!ach?.id || !ach.name) continue;

    achievements.push({
      id: ach.id,
      name: ach.name,
      desc: ach.description || "",
      icon: normalizeGogImageUrl(ach.imageUrlUnlocked || ach.imageUrlLocked),
      percent: typeof ach.rarity === "number" ? ach.rarity : 0,
      hidden: ach.visible === false,
      missable: false,
    });

    const statsObj = item.stats && !Array.isArray(item.stats) ? item.stats : null;
    const userStat = statsObj
      ? (targetUserId ? statsObj[targetUserId] : Object.values(statsObj)[0])
      : undefined;
    if (userStat?.isUnlocked) {
      unlockedIds.push(ach.id);
    }
  }

  return {
    achievements,
    unlockedIds,
    totalAchievements: achievements.length,
    unlockedCount: unlockedIds.length,
  };
}
