// lib/epic/service-persist.ts
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import {
  saveUserPlatformAccount,
  saveUserOwnedGames,
  saveUserGameProgress,
  saveEpicGameSandboxes,
} from "@/lib/db";
import { epicAchievementId } from "./game-achievements";
import type { AchSummary } from "./types";
import type { ResolvedEpicAuth } from "./service-auth";

export function persistEpicSyncData(
  auth: ResolvedEpicAuth,
  authUser: any,
  discoveredGames: OwnedGame[],
  gameNamespaceMap: Map<number, string>,
  achBySandbox: Map<string, AchSummary>,
  totalAchievements: number,
  completedGames: number,
  nowIso: string
): void {
  try {
    const plainKey = JSON.stringify({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accountId: auth.accountId,
    });
    const account: PlatformAccount = {
      platform: "epic",
      username: auth.accountId || auth.displayName,
      displayName: auth.displayName,
      connectedAt: nowIso,
      lastSyncedAt: nowIso,
      stats: {
        gamesOwned: discoveredGames.length,
        totalAchievements,
        completedGames,
      },
    };

    saveUserPlatformAccount(authUser.id, account, plainKey);
    if (discoveredGames.length > 0) {
      saveUserOwnedGames(authUser.id, discoveredGames);
      saveEpicGameSandboxes(
        authUser.id,
        Array.from(gameNamespaceMap.entries()).map(([appId, sandboxId]) => ({ appId, sandboxId }))
      );

      for (const g of discoveredGames) {
        if ((g.unlockedCount || 0) > 0) {
          const sId = gameNamespaceMap.get(g.appId)?.toLowerCase();
          const rec = sId ? achBySandbox.get(sId) : null;
          const playerAchs = rec?.playerAchievements || [];
          const unlockedNames: string[] = playerAchs
            .filter((p: any) => p.unlocked && p.achievementName)
            .map((p: any) => p.achievementName);
          const unlockedIds =
            unlockedNames.length > 0
              ? unlockedNames.map(epicAchievementId)
              : Array.from({ length: g.unlockedCount }, (_, idx) => `ach_${idx + 1}`);

          saveUserGameProgress(authUser.id, g.appId, "epic", {
            unlockedIds,
            lastPlayed: nowIso,
            notes: {},
          });
        }
      }
    }
  } catch (saveErr) {
    console.warn("Could not auto-persist Epic data to database:", saveErr);
  }
}
