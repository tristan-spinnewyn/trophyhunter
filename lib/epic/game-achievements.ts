// lib/epic/game-achievements.ts
import type { Achievement } from "@/lib/types";
import { resolveEpicSandboxId } from "./sandbox-resolver";
import {
  unwrapPlayerAchievement,
  epicAchievementId,
  fetchEpicProductAchievements,
  fetchEpicPlayerUnlockedNames,
} from "./product-achievements";

export {
  unwrapPlayerAchievement,
  epicAchievementId,
  fetchEpicProductAchievements,
  fetchEpicPlayerUnlockedNames,
  resolveEpicSandboxId,
};

export interface EpicGameAchievementData {
  sandboxId: string;
  achievements: Achievement[];
  unlockedIds: string[];
  unlockedTitles: string[];
  totalUnlocked: number;
}

export async function getEpicGameAchievements(params: {
  appId: number;
  gameName: string;
  accessToken: string;
  accountId: string;
  sandboxId?: string | null;
}): Promise<EpicGameAchievementData | null> {
  const { appId, gameName, accessToken, accountId } = params;
  const sandboxId = params.sandboxId || (await resolveEpicSandboxId(appId, gameName, accessToken));
  if (!sandboxId) return null;

  const [product, player] = await Promise.all([
    fetchEpicProductAchievements(sandboxId, accessToken),
    fetchEpicPlayerUnlockedNames(accountId, sandboxId, accessToken),
  ]);

  if (product.length === 0 && player.totalUnlocked === 0) {
    return { sandboxId, achievements: [], unlockedIds: [], unlockedTitles: [], totalUnlocked: 0 };
  }

  const unlocked = product.filter((a) => player.unlockedNames.has(a.epicName));
  const achievements: Achievement[] = product;

  return {
    sandboxId,
    achievements,
    unlockedIds: unlocked.map((a) => a.id),
    unlockedTitles: unlocked.map((a) => a.name),
    totalUnlocked: Math.max(player.totalUnlocked, unlocked.length),
  };
}
