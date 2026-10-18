// lib/epic/product-achievements.ts
import type { Achievement } from "@/lib/types";
import { isLikelyMissable } from "@/lib/steam/game-details";
import { epicGraphQL } from "./graphql-client";

const PRODUCT_ACHIEVEMENTS_QUERY = `query ProductAchievementsBySandbox($sandboxId: String!, $locale: String!) {
  Achievement {
    productAchievementsRecordBySandbox(sandboxId: $sandboxId, locale: $locale) {
      totalAchievements
      achievements {
        achievement { name hidden unlockedDisplayName lockedDisplayName unlockedDescription lockedDescription unlockedIconLink lockedIconLink XP rarity { percent } }
      }
    }
  }
}`;

const PLAYER_ACHIEVEMENTS_QUERY = `query PlayerAchievementBySandbox($epicAccountId: String!, $sandboxId: String!) {
  PlayerAchievement {
    playerAchievementGameRecordsBySandbox(epicAccountId: $epicAccountId, sandboxId: $sandboxId) {
      records {
        totalUnlocked
        playerAchievements { playerAchievement { achievementName unlocked unlockDate } }
      }
    }
  }
}`;

export function unwrapPlayerAchievement(entry: unknown): { achievementName: string; unlocked: boolean } {
  const obj = (entry ?? {}) as { playerAchievement?: Record<string, unknown> } & Record<string, unknown>;
  const p = obj.playerAchievement ?? obj;
  return { achievementName: String(p.achievementName || ""), unlocked: Boolean(p.unlocked) };
}

export function epicAchievementId(name: string): string {
  return `epic_${name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60)}`;
}

interface ProductAchievementsQueryData {
  readonly Achievement?: {
    readonly productAchievementsRecordBySandbox?: {
      readonly achievements?: ReadonlyArray<{ readonly achievement?: Record<string, unknown> } & Record<string, unknown>>;
    };
  };
}

interface PlayerAchievementsQueryData {
  readonly PlayerAchievement?: {
    readonly playerAchievementGameRecordsBySandbox?: {
      readonly records?: ReadonlyArray<{ readonly totalUnlocked?: number; readonly playerAchievements?: ReadonlyArray<unknown> }>;
    };
  };
}

export async function fetchEpicProductAchievements(sandboxId: string, accessToken: string, locale = "fr"): Promise<Array<Achievement & { epicName: string }>> {
  const data = await epicGraphQL<ProductAchievementsQueryData>(PRODUCT_ACHIEVEMENTS_QUERY, { sandboxId, locale }, accessToken);
  const list = data?.Achievement?.productAchievementsRecordBySandbox?.achievements || [];

  return list
    .map((entry) => (entry?.achievement ?? entry) as Record<string, unknown>)
    .filter((a) => Boolean(a?.name))
    .map((a) => {
      const rawName = String(a.name || "");
      const name = String(a.unlockedDisplayName || a.lockedDisplayName || rawName);
      const hidden = Boolean(a.hidden);
      const desc = String(a.unlockedDescription || a.lockedDescription || (hidden ? "Succès secret (Masqué par le jeu)" : ""));
      const rarity = a.rarity as { percent?: number } | undefined;
      return {
        id: epicAchievementId(rawName),
        epicName: rawName,
        name,
        desc,
        icon: String(a.unlockedIconLink || a.lockedIconLink || ""),
        percent: Number(rarity?.percent) || 0,
        hidden,
        missable: isLikelyMissable(name, desc),
      };
    });
}

export async function fetchEpicPlayerUnlockedNames(
  accountId: string,
  sandboxId: string,
  accessToken: string
): Promise<{ unlockedNames: Set<string>; totalUnlocked: number }> {
  const data = await epicGraphQL<PlayerAchievementsQueryData>(PLAYER_ACHIEVEMENTS_QUERY, { epicAccountId: accountId, sandboxId }, accessToken);
  const records = data?.PlayerAchievement?.playerAchievementGameRecordsBySandbox?.records || [];

  const unlockedNames = new Set<string>();
  let totalUnlocked = 0;
  for (const rec of records) {
    totalUnlocked = Math.max(totalUnlocked, Number(rec?.totalUnlocked) || 0);
    for (const entry of rec?.playerAchievements || []) {
      const p = unwrapPlayerAchievement(entry);
      if (p.unlocked && p.achievementName) unlockedNames.add(p.achievementName);
    }
  }
  return { unlockedNames, totalUnlocked: Math.max(totalUnlocked, unlockedNames.size) };
}
