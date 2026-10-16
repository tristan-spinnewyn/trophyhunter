// lib/epic/achievements-parser.ts
import type { AchSummary } from "./types";
import { extractBestCover } from "./helpers";
import { unwrapPlayerAchievement } from "./game-achievements";

export function parseEpicAchievementRecords(records: any[]): {
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

    let totalInGame = playerAchs.length;
    if (totalInGame === 0) {
      totalInGame = Math.max(
        unlocked,
        sets.reduce((acc: number, s: any) => acc + (s.totalAchievements || s.totalUnlocked || 0), 0)
      );
    }

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

export function mergeEpicSummaries(achBySandbox: Map<string, AchSummary>, sumItems: any[]): void {
  for (const it of sumItems) {
    const sId = (it.sandboxId || "").toLowerCase();
    if (!sId) continue;
    const unlocked = it.totalUnlocked || 0;
    const total = it.productAchievements?.totalAchievements || Math.max(unlocked, it.totalAchievements || 0);
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
        sandboxId: sId,
        totalUnlocked: unlocked,
        totalAchievements: total,
        totalXP: it.totalXP || 0,
        gameTitle: title,
        coverUrl: cover,
      });
    }
  }
}
