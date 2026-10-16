"use client";

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
  const handleSync = async () => {
    if (!game) return;

    if (activePlatform === "epic") {
      const epicAccount = accountProfile.accounts.epic;
      if (!epicAccount) {
        setSyncNotice({
          type: "error",
          msg: "Veuillez lier votre compte Epic Games dans l'onglet Comptes.",
        });
        return;
      }

      setIsSyncing(true);
      setSyncNotice(null);

      try {
        let res = await fetch(
          `/api/sync?platform=epic&appId=${game.id}&name=${encodeURIComponent(
            game.name
          )}&user=${encodeURIComponent(epicAccount.username || "")}`
        );
        let data = await res.json();

        if (data.requiresToken || (!data.success && data.error?.includes("authorizationToken"))) {
          const userToken = window.prompt(
            "Pour synchroniser vos succès officiels avec Epic Games, collez votre authorizationToken ou code d'échange Epic :\n(Obtenez-le sur : https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code)"
          );
          if (userToken && userToken.trim()) {
            res = await fetch(
              `/api/sync?platform=epic&appId=${game.id}&name=${encodeURIComponent(
                game.name
              )}&user=${encodeURIComponent(
                epicAccount.username || ""
              )}&authorizationToken=${encodeURIComponent(userToken.trim())}`
            );
            data = await res.json();
          }
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Échec de la synchronisation Epic Games.");
        }

        const normalize = (s: string) =>
          s.replace(/[’']/g, "'").trim().toLowerCase();
        const unlockedTitles: string[] = data.unlockedTitles || [];
        const matched = game.achievements
          .filter((a) =>
            unlockedTitles.some((t) => normalize(t) === normalize(a.name))
          )
          .map((a) => a.id);

        const newUnlockedIds = Array.from(
          new Set([...progress.unlockedIds, ...matched])
        );

        const updatedProgress: UserGameProgress = {
          ...progress,
          unlockedIds: newUnlockedIds,
          lastPlayed: new Date().toISOString(),
        };

        setProgress(updatedProgress);

        if (owned) {
          await upsertOwnedGameInMemoryAndDb({
            ...owned,
            unlockedCount: Math.max(
              owned.unlockedCount || 0,
              newUnlockedIds.length
            ),
          });
        }

        setSyncNotice({
          type: "success",
          msg: `Synchronisation Epic réussie : ${matched.length} succès reconnus.`,
        });
      } catch (err: any) {
        setSyncNotice({
          type: "error",
          msg: err.message || "Erreur de synchronisation Epic Games.",
        });
      } finally {
        setIsSyncing(false);
      }
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

  return { handleSync };
}
