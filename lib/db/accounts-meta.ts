// lib/db/accounts-meta.ts
import type { PlatformAccount } from "../types";

export interface ParsedStatsMeta {
  stats: PlatformAccount["stats"];
  meta: {
    level?: number;
    onlineState?: string;
    memberSince?: string;
    location?: string;
    rareShowcase?: PlatformAccount["rareShowcase"];
  };
}

export function parseAccountStatsJson(statsJson: string | null): ParsedStatsMeta {
  let stats: PlatformAccount["stats"] = {
    gamesOwned: 0,
    totalAchievements: 0,
    completedGames: 0,
  };
  let meta: ParsedStatsMeta["meta"] = {};

  if (statsJson) {
    try {
      const parsed = JSON.parse(statsJson);
      const { _meta, ...restStats } = parsed || {};
      stats = { ...stats, ...restStats };
      if (_meta && typeof _meta === "object") {
        meta = _meta;
      }
    } catch {
      // Use fallback defaults
    }
  }

  return { stats, meta };
}

export function serializeAccountStats(account: PlatformAccount): string {
  const statsPayload = {
    ...(account.stats || {}),
    _meta: {
      level: account.level,
      onlineState: account.onlineState,
      memberSince: account.memberSince,
      location: account.location,
      rareShowcase: account.rareShowcase,
    },
  };
  return JSON.stringify(statsPayload);
}
