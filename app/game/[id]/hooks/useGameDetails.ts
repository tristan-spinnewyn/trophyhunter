// app/game/[id]/hooks/useGameDetails.ts
"use client";
import { useState, useEffect } from "react";
import type { GameDetails, UserGameProgress } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic/game-metadata";
import { triggerSteamAutoSync } from "./gameAutoSyncSteam";
import { fetchRemoteUserProgress, fetchGameDetailsApi } from "./fetchGameData";
import type {
  OwnedGame,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";

export interface UseGameDetailsParams {
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
  const [progress, setProgress] = useState<UserGameProgress>({ unlockedIds: [], notes: {} });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      let currentProgress = currentUser
        ? (await fetchRemoteUserProgress(appId, activePlatform)) || { unlockedIds: [], notes: {} }
        : { unlockedIds: [], notes: {} };

      if (isCancelled) return;
      setProgress(currentProgress);

      try {
        const data = await fetchGameDetailsApi(appId, owned?.name, owned?.platform);
        if (isCancelled) return;
        setGame(data);

        if (Array.isArray(data.unlockedIds) && data.unlockedIds.length > currentProgress.unlockedIds.length) {
          currentProgress = { ...currentProgress, unlockedIds: data.unlockedIds };
          setProgress(currentProgress);
        } else if ((activePlatform === "epic" || activePlatform === "gog" || activePlatform === "xbox") && currentUser) {
          const refreshedProgress = await fetchRemoteUserProgress(appId, activePlatform);
          if (!isCancelled && refreshedProgress && refreshedProgress.unlockedIds.length >= currentProgress.unlockedIds.length) {
            currentProgress = refreshedProgress;
            setProgress(refreshedProgress);
          }
        }

        if (owned) {
          const unlockedCount = Math.max(owned.unlockedCount || 0, currentProgress.unlockedIds.length);
          await upsertOwnedGameInMemoryAndDb({
            ...owned,
            appId: data.id,
            name: owned.name || data.name,
            headerImg: !isUnsplashPlaceholder(owned.headerImg) ? owned.headerImg : data.headerImg || owned.headerImg,
            platform: activePlatform,
            totalAchievements: data.totalAchievements,
            unlockedCount,
          });
        }

        const user = accountProfile.accounts.steam?.username || steamUser;
        if (activePlatform === "steam" && user && currentProgress.unlockedIds.length === 0) {
          triggerSteamAutoSync({
            appId, user, gameData: data, owned, currentProgress, currentUser, upsertOwnedGameInMemoryAndDb,
            onSynced: (updated, count) => {
              if (isCancelled) return;
              setProgress(updated);
              setSyncNotice({ type: "success", msg: `${count} succès synchronisés automatiquement depuis Steam !` });
              setTimeout(() => setSyncNotice(null), 5000);
            },
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement.";
        if (!isCancelled) setError(message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { isCancelled = true; };
  }, [appId, activePlatform, currentUser?.id, owned?.name]);

  return { game, setGame, progress, setProgress, isLoading, error, isSyncing, setIsSyncing, syncNotice, setSyncNotice };
}
