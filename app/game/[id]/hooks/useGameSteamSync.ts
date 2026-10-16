// app/game/[id]/hooks/useGameSteamSync.ts
"use client";

import type { UseGameSyncActionParams } from "./useGameSyncAction.types";
import type { UserGameProgress } from "@/lib/types";

export function useGameSteamSync({
  game,
  owned,
  progress,
  setProgress,
  accountProfile,
  steamUser,
  currentUser,
  upsertOwnedGameInMemoryAndDb,
  setIsSyncing,
  setSyncNotice,
}: Omit<UseGameSyncActionParams, "activePlatform" | "setGame">) {
  const executeSteamSync = async () => {
    if (!game) return;
    const user = accountProfile.accounts.steam?.username || steamUser;
    if (!user) {
      setSyncNotice({ type: "error", msg: "Veuillez configurer votre pseudo ou SteamID dans vos comptes." });
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);

    try {
      const res = await fetch(`/api/sync?user=${encodeURIComponent(user)}&appId=${game.id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Échec de la synchronisation Steam.");

      const normalize = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase();
      const matched = data.unlockedIds && data.unlockedIds.length > 0
        ? data.unlockedIds
        : game.achievements
            .filter((a) => data.unlockedTitles.some((t: string) => normalize(t) === normalize(a.name)))
            .map((a) => a.id);

      const updatedProgress: UserGameProgress = {
        ...progress,
        unlockedIds: matched,
        lastPlayed: new Date().toISOString(),
      };
      setProgress(updatedProgress);

      if (owned) {
        await upsertOwnedGameInMemoryAndDb({ ...owned, unlockedCount: matched.length });
      }

      if (currentUser) {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: game.id, platform: "steam", progress: updatedProgress }),
        });
      }

      setSyncNotice({
        type: "success",
        msg: `Synchronisation réussie : ${matched.length}/${game.totalAchievements} succès débloqués !`,
      });
    } catch (err: any) {
      setSyncNotice({ type: "error", msg: err.message || "Erreur lors de la synchronisation." });
    } finally {
      setIsSyncing(false);
    }
  };

  return { executeSteamSync };
}
