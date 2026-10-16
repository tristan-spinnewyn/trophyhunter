"use client";

import { useState } from "react";
import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";

interface UseGameSyncActionParams {
  game: GameDetails | null;
  setGame?: (g: GameDetails) => void;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  progress: UserGameProgress;
  setProgress: (p: UserGameProgress) => void;
  accountProfile: UserAccountProfile;
  steamUser: string;
  currentUser: UserType | null;
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<any>;
  setIsSyncing: (s: boolean) => void;
  setSyncNotice: (n: { type: "success" | "error"; msg: string } | null) => void;
}

export function useGameSyncAction({
  game,
  setGame,
  owned,
  activePlatform,
  progress,
  setProgress,
  accountProfile,
  steamUser,
  currentUser,
  upsertOwnedGameInMemoryAndDb,
  setIsSyncing,
  setSyncNotice,
}: UseGameSyncActionParams) {
  const [isEpicAuthModalOpen, setIsEpicAuthModalOpen] = useState(false);
  const [epicAuthModalError, setEpicAuthModalError] = useState<string | null>(null);

  const applyEpicSyncData = async (data: any) => {
    if (!game) return;

    let currentAchievements = game.achievements;
    if (Array.isArray(data.achievements) && data.achievements.length > 0) {
      currentAchievements = data.achievements;
      if (setGame) {
        setGame({
          ...game,
          achievements: data.achievements,
          totalAchievements: data.achievements.length,
        });
      }
    }

    const normalize = (s: string) =>
      s.replace(/[’']/g, "'").trim().toLowerCase();
    const unlockedTitles: string[] = data.unlockedTitles || [];
    const returnedUnlockedIds: string[] = data.unlockedIds || [];

    const matched = currentAchievements
      .filter((a) =>
        returnedUnlockedIds.includes(a.id) ||
        unlockedTitles.some((t) => normalize(t) === normalize(a.name))
      )
      .map((a) => a.id);

    const newUnlockedIds = Array.from(
      new Set([
        ...progress.unlockedIds,
        ...matched,
        ...(returnedUnlockedIds.length > 0 && matched.length === 0
          ? returnedUnlockedIds
          : []),
      ])
    );

    const updatedProgress: UserGameProgress = {
      ...progress,
      unlockedIds: newUnlockedIds,
      lastPlayed: new Date().toISOString(),
    };

    setProgress(updatedProgress);

    const resolvedTotal =
      data.totalAchievements || currentAchievements.length || game.totalAchievements;

    if (owned) {
      await upsertOwnedGameInMemoryAndDb({
        ...owned,
        totalAchievements: resolvedTotal,
        unlockedCount: Math.max(
          owned.unlockedCount || 0,
          newUnlockedIds.length
        ),
      });
    }

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: "epic",
            progress: updatedProgress,
          }),
        });
      } catch {}
    }

    setSyncNotice({
      type: "success",
      msg: `Synchronisation Epic réussie : ${newUnlockedIds.length}/${resolvedTotal} succès débloqués !`,
    });
  };

  const executeEpicSync = async (userToken?: string) => {
    if (!game) return;
    const epicAccount = accountProfile.accounts.epic;
    if (!epicAccount && !userToken) {
      setEpicAuthModalError(null);
      setIsEpicAuthModalOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);

    try {
      const tokenParam = userToken
        ? `&authorizationToken=${encodeURIComponent(userToken.trim())}`
        : "";
      const userParam = epicAccount?.username
        ? `&user=${encodeURIComponent(epicAccount.username)}`
        : "";
      const res = await fetch(
        `/api/sync?platform=epic&appId=${game.id}&name=${encodeURIComponent(
          game.name
        )}${userParam}${tokenParam}`
      );
      const data = await res.json();

      if (data.requiresToken || (!data.success && data.error?.includes("authorizationToken"))) {
        setEpicAuthModalError(data.error || null);
        setIsEpicAuthModalOpen(true);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de la synchronisation Epic Games.");
      }

      await applyEpicSyncData(data);
      setIsEpicAuthModalOpen(false);
      setEpicAuthModalError(null);
    } catch (err: any) {
      setSyncNotice({
        type: "error",
        msg: err.message || "Erreur de synchronisation Epic Games.",
      });
      if (userToken) {
        setEpicAuthModalError(err.message || "Erreur de validation du code Epic.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const openEpicAuthModal = () => {
    setEpicAuthModalError(null);
    setIsEpicAuthModalOpen(true);
  };

  const handleEpicAuthSubmit = async (token: string) => {
    await executeEpicSync(token);
  };

  const handleSync = async () => {
    if (!game) return;

    if (activePlatform === "epic") {
      await executeEpicSync();
      return;
    }

    // Default: Steam sync
    const user = accountProfile.accounts.steam?.username || steamUser;
    if (!user) {
      setSyncNotice({
        type: "error",
        msg: "Veuillez configurer votre pseudo ou SteamID dans vos comptes.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);

    try {
      const res = await fetch(
        `/api/sync?user=${encodeURIComponent(user)}&appId=${game.id}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Échec de la synchronisation Steam.");
      }

      const normalize = (s: string) =>
        s.replace(/[’']/g, "'").trim().toLowerCase();
      const matched =
        data.unlockedIds && data.unlockedIds.length > 0
          ? data.unlockedIds
          : game.achievements
              .filter((a) =>
                data.unlockedTitles.some(
                  (t: string) => normalize(t) === normalize(a.name)
                )
              )
              .map((a) => a.id);

      const updatedProgress: UserGameProgress = {
        ...progress,
        unlockedIds: matched,
        lastPlayed: new Date().toISOString(),
      };
      setProgress(updatedProgress);

      if (owned) {
        await upsertOwnedGameInMemoryAndDb({
          ...owned,
          unlockedCount: matched.length,
        });
      }

      if (currentUser) {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: "steam",
            progress: updatedProgress,
          }),
        });
      }

      setSyncNotice({
        type: "success",
        msg: `Synchronisation réussie : ${matched.length}/${game.totalAchievements} succès débloqués !`,
      });
    } catch (err: any) {
      setSyncNotice({
        type: "error",
        msg: err.message || "Erreur lors de la synchronisation.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    handleSync,
    isEpicAuthModalOpen,
    setIsEpicAuthModalOpen,
    openEpicAuthModal,
    epicAuthModalError,
    handleEpicAuthSubmit,
  };
}
