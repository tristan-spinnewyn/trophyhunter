// lib/epic/achievements-parser.ts
import type { AchSummary } from "./types";
import { extractBestCover } from "./helpers";
import { unwrapPlayerAchievement } from "./game-achievements";

export interface RawEpicAchSet {
  readonly totalAchievements?: number;
  readonly totalUnlocked?: number;
}

export interface RawEpicAchRecord {
  readonly sandboxId?: string;
  readonly totalUnlocked?: number;
  readonly totalXP?: number;
  readonly playerAchievements?: readonly unknown[];
  readonly achievementSets?: readonly RawEpicAchSet[];
}

export interface RawEpicSummaryItem {
  readonly sandboxId?: string;
  readonly totalUnlocked?: number;
  readonly totalAchievements?: number;
  readonly totalXP?: number;
  readonly product?: { readonly name?: string };
  readonly baseOfferForSandbox?: { readonly keyImages?: unknown };
  readonly productAchievements?: { readonly totalAchievements?: number };
}

export function parseEpicAchievementRecords(records: readonly RawEpicAchRecord[]): {
  achBySandbox: Map<string, AchSummary>;
  rawTotalAchievements: number;
  rawCompletedGames: number;
} {
  const achBySandbox = new Map<string, AchSummary>();
  let rawTotalAchievements = 0;
  let rawCompletedGames = 0;

  for (const achRec of records) {
    const sId = (achRec.sandboxId || "").toLowerCase();
    if (!sId) continue;

    const unlocked = achRec.totalUnlocked || 0;
    rawTotalAchievements += unlocked;

    const playerAchs = Array.isArray(achRec.playerAchievements)
      ? achRec.playerAchievements.map(unwrapPlayerAchievement)
      : [];
    const sets = Array.isArray(achRec.achievementSets) ? achRec.achievementSets : [];
    const setsTotal = sets.reduce((acc, s) => acc + (s.totalAchievements || 0), 0);
    const hasLockedInList = playerAchs.some((p) => !p.unlocked);
    const totalInGame = setsTotal > 0 ? Math.max(setsTotal, playerAchs.length, unlocked) : hasLockedInList ? playerAchs.length : 0;

    if (unlocked > 0 && totalInGame > 0 && unlocked >= totalInGame) {
      rawCompletedGames += 1;
    }

    achBySandbox.set(sId, {
      sandboxId: sId,
      totalUnlocked: unlocked,
      totalAchievements: totalInGame,
      totalXP: achRec.totalXP || 0,
      playerAchievements: playerAchs,
    });
  }

  return { achBySandbox, rawTotalAchievements, rawCompletedGames };
}

export function mergeEpicSummaries(achBySandbox: Map<string, AchSummary>, sumItems: readonly RawEpicSummaryItem[]): void {
  for (const it of sumItems) {
    const sId = (it.sandboxId || "").toLowerCase();
    if (!sId) continue;
    const unlocked = it.totalUnlocked || 0;
    const total = it.productAchievements?.totalAchievements || it.totalAchievements || 0;
    const title = it.product?.name || "";
    const cover = extractBestCover(it.baseOfferForSandbox?.keyImages);

    const existing = achBySandbox.get(sId);
    if (existing) {
      if (title && !existing.gameTitle) existing.gameTitle = title;
      if (cover && !existing.coverUrl) existing.coverUrl = cover;
      if (total > existing.totalAchievements) existing.totalAchievements = total;
      if (unlocked > existing.totalUnlocked) existing.totalUnlocked = unlocked;
    } else {
      achBySandbox.set(sId, {
        sandboxId: sId, totalUnlocked: unlocked, totalAchievements: total,
        totalXP: it.totalXP || 0, gameTitle: title, coverUrl: cover,
      });
    }
  }
}


