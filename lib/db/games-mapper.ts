// lib/db/games-mapper.ts
import type { OwnedGame, PlatformType } from "../types";

export interface UserGameRow {
  app_id: number;
  name: string;
  header_img: string | null;
  platform: PlatformType;
  total_achievements: number;
  unlocked_count: number;
  playtime_hours: number | null;
  last_played: string | null;
  added_at: string;
  source: string | null;
}

export function mapUserGameRow(r: UserGameRow): OwnedGame {
  return {
    appId: r.app_id,
    name: r.name,
    headerImg: r.header_img || "",
    platform: r.platform,
    totalAchievements: r.total_achievements,
    unlockedCount: r.unlocked_count,
    playtimeHours: r.playtime_hours ?? undefined,
    lastPlayed: r.last_played ?? undefined,
    addedAt: r.added_at,
    source: (r.source as OwnedGame["source"]) || undefined,
  };
}
