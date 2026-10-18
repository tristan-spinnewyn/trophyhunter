// lib/db/games-mapper.ts
import type { OwnedGame, PlatformType } from "../types";
import { resolveGameStatus } from "../game-status/game-status.services";

export interface UserGameRow {
  readonly app_id: number;
  readonly name: string;
  readonly header_img: string | null;
  readonly platform: PlatformType;
  readonly total_achievements: number;
  readonly unlocked_count: number;
  readonly playtime_hours: number | null;
  readonly last_played: string | null;
  readonly added_at: string;
  readonly source: string | null;
  readonly status?: string | null;
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
    status: resolveGameStatus(r.status),
  };
}
