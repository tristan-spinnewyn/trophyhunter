// components/dashboard/hooks/useSteamSingleGameSync.ts

import type { OwnedGame, User as UserType } from "@/lib/types";

interface UseSteamSingleGameSyncProps {
  currentUser?: UserType | null;
}

export function useSteamSingleGameSync({ currentUser }: UseSteamSingleGameSyncProps) {
  const syncSingleSteamGame = async (
    user: string,
    game: OwnedGame
  ): Promise<OwnedGame> => {
    try {
      const res = await fetch(
        `/api/sync?user=${encodeURIComponent(user)}&appId=${game.appId}`
      );
      if (!res.ok) return game;
      const data = await res.json();
      if (!data.success) return game;

      const unlockedIds: string[] = Array.isArray(data.unlockedIds)
        ? data.unlockedIds
        : [];

      const totalAch = data.totalAchievements || game.totalAchievements || 0;
      const unlockedCount = Math.max(
        data.count || 0,
        unlockedIds.length,
        game.unlockedCount || 0
      );

      if (unlockedIds.length > 0 && currentUser) {
        fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.appId,
            platform: "steam",
            progress: {
              unlockedIds,
              notes: {},
              lastPlayed: new Date().toISOString(),
            },
          }),
        }).catch(() => {});
      }

      return {
        ...game,
        name:
          game.name.startsWith("Jeu Steam #") && data.gameName
            ? data.gameName
            : game.name,
        totalAchievements: totalAch,
        unlockedCount,
      };
    } catch {
      return game;
    }
  };

  return { syncSingleSteamGame };
}
