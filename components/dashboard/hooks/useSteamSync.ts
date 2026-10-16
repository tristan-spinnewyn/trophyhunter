import { useState } from "react";
import type {
  OwnedGame,
  PlatformAccount,
  User as UserType,
} from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";

interface UseSteamSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  setSyncProgressText: (text: string | null) => void;
  steamInput: string;
  steamApiKey: string;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (
    account: PlatformAccount,
    plainApiKey?: string
  ) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
}

export function useSteamSync({
  ownedGames,
  onOwnedGamesChange,
  onSteamUserChange,
  currentUser,
  setBannerMsg,
  setSyncProgressText,
  steamInput,
  steamApiKey,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
}: UseSteamSyncProps) {
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);

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

  const handleConnectAndSyncSteam = async (targetUser?: string | unknown) => {
    const rawTarget = typeof targetUser === "string" ? targetUser : steamInput;
    const userToSync = (rawTarget || "").trim();
    if (!userToSync) return;

    setIsSyncingSteam(true);
    setBannerMsg(null);
    setSyncProgressText("Connexion au profil Steam...");

    try {
      const keyParam = steamApiKey.trim()
        ? `&key=${encodeURIComponent(steamApiKey.trim())}`
        : "";
      const res = await fetch(
        `/api/profile/steam?user=${encodeURIComponent(userToSync)}${keyParam}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de récupérer le profil Steam."
        );
      }

      const fetchedAccount: PlatformAccount = data.account;
      const discovered: OwnedGame[] = data.discoveredGames || [];

      onSteamUserChange(fetchedAccount.username);
      updateAccountProfileInMemory(fetchedAccount);

      let mergedGames = mergeGamesList(ownedGames, discovered);
      onOwnedGamesChange(mergedGames);

      const steamGamesToSync = mergedGames.filter(
        (g) => g.platform === "steam"
      );

      let syncedAchievementsTotal = 0;
      const updatedSteamGames: OwnedGame[] = [];

      for (let i = 0; i < steamGamesToSync.length; i++) {
        const g = steamGamesToSync[i];
        setSyncProgressText(
          `Synchronisation des succès (${i + 1}/${steamGamesToSync.length}) : ${g.name}...`
        );
        const syncedGame = await syncSingleSteamGame(
          fetchedAccount.username,
          g
        );
        syncedAchievementsTotal += syncedGame.unlockedCount;
        updatedSteamGames.push(syncedGame);
      }

      mergedGames = mergeGamesList(mergedGames, updatedSteamGames);
      onOwnedGamesChange(mergedGames);

      const localCompleted = mergedGames.filter(
        (g) =>
          g.platform === "steam" &&
          g.totalAchievements > 0 &&
          g.unlockedCount >= g.totalAchievements
      ).length;

      const finalAccount: PlatformAccount = {
        ...fetchedAccount,
        stats: {
          ...fetchedAccount.stats,
          gamesOwned: Math.max(
            fetchedAccount.stats.gamesOwned,
            steamGamesToSync.length
          ),
          totalAchievements: Math.max(
            fetchedAccount.stats.totalAchievements,
            syncedAchievementsTotal
          ),
          completedGames: Math.max(
            fetchedAccount.stats.completedGames,
            localCompleted
          ),
        },
      };

      updateAccountProfileInMemory(finalAccount);
      await persistAccountToSQLite(
        finalAccount,
        steamApiKey.trim() || undefined
      );
      await persistGamesToSQLite(mergedGames);

      setBannerMsg({
        type: "success",
        text: `Compte Steam "${fetchedAccount.displayName}" synchronisé ! ${steamGamesToSync.length} jeux importés et sauvegardés dans SQLite.`,
      });
    } catch (err: any) {
      setBannerMsg({
        type: "error",
        text: err.message || "Erreur lors de la synchronisation Steam.",
      });
    } finally {
      setIsSyncingSteam(false);
      setSyncProgressText(null);
    }
  };

  return {
    isSyncingSteam,
    syncSingleSteamGame,
    handleConnectAndSyncSteam,
  };
}
