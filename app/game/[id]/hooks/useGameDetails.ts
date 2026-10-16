"use client";

import { useState, useEffect } from "react";
import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

interface UseGameDetailsParams {
  appId: number;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  currentUser: UserType | null;
  accountProfile: UserAccountProfile;
  steamUser: string;
  upsertOwnedGameInMemoryAndDb: (game: OwnedGame) => Promise<any>;
}

export function useGameDetails({
  appId,
  owned,
  activePlatform,
  currentUser,
  accountProfile,
  steamUser,
  upsertOwnedGameInMemoryAndDb,
}: UseGameDetailsParams) {
  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<UserGameProgress>({
    unlockedIds: [],
    notes: {},
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (isNaN(appId)) {
      setError("Identifiant de jeu invalide.");
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchData() {
      let currentProgress: UserGameProgress = { unlockedIds: [], notes: {} };

      if (currentUser) {
        try {
          const progRes = await fetch(
            `/api/user/progress?appId=${appId}&platform=${activePlatform}`
          );
          if (progRes.ok) {
            const progData = await progRes.json();
            if (progData?.progress) {
              currentProgress = progData.progress;
            }
          }
        } catch {}
      }

      if (isCancelled) return;
      setProgress(currentProgress);

      const query = new URLSearchParams();
      if (owned?.name) query.set("name", owned.name);
      if (owned?.platform) query.set("platform", owned.platform);
      const queryString = query.toString() ? `?${query.toString()}` : "";

      try {
        const res = await fetch(`/api/game/${appId}${queryString}`);
        if (!res.ok) {
          throw new Error("Impossible de récupérer les succès du jeu.");
        }
        const data: GameDetails = await res.json();
        if (isCancelled) return;
        setGame(data);

        // Update total achievements if owned
        if (owned) {
          const unlockedCount = Math.max(
            owned.unlockedCount || 0,
            currentProgress.unlockedIds.length
          );
          await upsertOwnedGameInMemoryAndDb({
            ...owned,
            appId: data.id,
            name: owned.name || data.name,
            headerImg:
              !isUnsplashPlaceholder(owned.headerImg)
                ? owned.headerImg
                : data.headerImg || owned.headerImg,
            platform: activePlatform,
            totalAchievements: data.totalAchievements,
            unlockedCount,
          });
        }

        // Auto-sync Steam if Steam game and 0 checked achievements
        const user = accountProfile.accounts.steam?.username || steamUser;
        if (
          activePlatform === "steam" &&
          user &&
          currentProgress.unlockedIds.length === 0
        ) {
          fetch(`/api/sync?user=${encodeURIComponent(user)}&appId=${appId}`)
            .then((r) => r.json())
            .then(async (syncData) => {
              if (syncData.success && syncData.unlockedTitles) {
                const normalize = (s: string) =>
                  s.replace(/[’']/g, "'").trim().toLowerCase();
                const matched =
                  syncData.unlockedIds && syncData.unlockedIds.length > 0
                    ? syncData.unlockedIds
                    : data.achievements
                        .filter((a) =>
                          syncData.unlockedTitles.some(
                            (t: string) => normalize(t) === normalize(a.name)
                          )
                        )
                        .map((a) => a.id);

                if (matched.length > 0 && !isCancelled) {
                  const updated: UserGameProgress = {
                    ...currentProgress,
                    unlockedIds: matched,
                    lastPlayed: new Date().toISOString(),
                  };
                  setProgress(updated);

                  await upsertOwnedGameInMemoryAndDb({
                    appId,
                    name: data.name,
                    headerImg: data.headerImg,
                    platform: "steam",
                    totalAchievements: data.totalAchievements,
                    unlockedCount: matched.length,
                    addedAt: owned?.addedAt || new Date().toISOString(),
                  });

                  if (currentUser) {
                    fetch("/api/user/progress", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        appId,
                        platform: "steam",
                        progress: updated,
                      }),
                    }).catch(() => {});
                  }

                  setSyncNotice({
                    type: "success",
                    msg: `${matched.length} succès synchronisés automatiquement depuis Steam !`,
                  });
                  setTimeout(() => setSyncNotice(null), 5000);
                }
              }
            })
            .catch(() => {});
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Erreur lors du chargement.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [appId, activePlatform, currentUser?.id]);

  return {
    game,
    setGame,
    progress,
    setProgress,
    isLoading,
    error,
    isSyncing,
    setIsSyncing,
    syncNotice,
    setSyncNotice,
  };
}
