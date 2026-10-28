// app/game/[id]/hooks/gameAutoSyncSteam.ts

import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  User as UserType,
} from "@/lib/types";

interface AutoSyncParams {
  appId: number;
  user: string;
  gameData: GameDetails;
  owned?: OwnedGame;
  currentProgress: UserGameProgress;
  currentUser: UserType | null;
  upsertOwnedGameInMemoryAndDb: (game: OwnedGame) => Promise<void>;
  onSynced: (updated: UserGameProgress, count: number) => void;
}

export function triggerSteamAutoSync({
  appId,
  user,
  gameData,
  owned,
  currentProgress,
  currentUser,
  upsertOwnedGameInMemoryAndDb,
  onSynced,
}: AutoSyncParams) {
  fetch(`/api/sync?user=${encodeURIComponent(user)}&appId=${appId}`)
    .then((r) => r.json())
    .then(async (syncData) => {
      if (!syncData.success || !syncData.unlockedTitles) return;

      const normalize = (s: string) =>
        s.replace(/[’']/g, "'").trim().toLowerCase();
      const matched =
        syncData.unlockedIds && syncData.unlockedIds.length > 0
          ? syncData.unlockedIds
          : gameData.achievements
              .filter((a) =>
                syncData.unlockedTitles.some((t: string) => normalize(t) === normalize(a.name))
              )
              .map((a) => a.id);

      if (matched.length === 0) return;

      const updated: UserGameProgress = {
        ...currentProgress,
        unlockedIds: matched,
        lastPlayed: new Date().toISOString(),
      };

      await upsertOwnedGameInMemoryAndDb({
        appId,
        name: gameData.name,
        headerImg: gameData.headerImg,
        platform: "steam",
        totalAchievements: gameData.totalAchievements,
        unlockedCount: matched.length,
        addedAt: owned?.addedAt || new Date().toISOString(),
      });

      if (currentUser) {
        fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, platform: "steam", progress: updated }),
        }).catch(() => {});
      }

      onSynced(updated, matched.length);
    })
    .catch(() => {});
}
