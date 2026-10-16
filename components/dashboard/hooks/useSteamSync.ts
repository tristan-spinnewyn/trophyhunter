// components/dashboard/hooks/useSteamSync.ts

import { useState } from "react";
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";
import type { UseSteamSyncProps } from "./useSteamSync.types";
import { useSteamSingleGameSync } from "./useSteamSingleGameSync";
import { syncSteamAchievementsBatch } from "./steamAchievementsBatch";

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
  const { syncSingleSteamGame } = useSteamSingleGameSync({ currentUser });

  const handleConnectAndSyncSteam = async (targetUser?: string | unknown) => {
    const rawTarget = typeof targetUser === "string" ? targetUser : steamInput;
    const userToSync = (rawTarget || "").trim();
    if (!userToSync) return;

    setIsSyncingSteam(true);
    setBannerMsg(null);
    setSyncProgressText("Connexion au profil Steam...");

    try {
      const keyParam = steamApiKey.trim() ? `&key=${encodeURIComponent(steamApiKey.trim())}` : "";
      const res = await fetch(`/api/profile/steam?user=${encodeURIComponent(userToSync)}${keyParam}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Impossible de récupérer le profil Steam.");

      const fetchedAccount: PlatformAccount = data.account;
      const discovered: OwnedGame[] = data.discoveredGames || [];

      onSteamUserChange(fetchedAccount.username);
      updateAccountProfileInMemory(fetchedAccount);

      let mergedGames = mergeGamesList(ownedGames, discovered);
      onOwnedGamesChange(mergedGames);

      const steamGamesToSync = mergedGames.filter((g) => g.platform === "steam");
      const { updatedGames, totalUnlocked } = await syncSteamAchievementsBatch(
        fetchedAccount.username,
        steamGamesToSync,
        syncSingleSteamGame,
        (text) => setSyncProgressText(text)
      );

      mergedGames = mergeGamesList(mergedGames, updatedGames);
      onOwnedGamesChange(mergedGames);

      const localCompleted = mergedGames.filter(
        (g) => g.platform === "steam" && g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements
      ).length;

      const finalAccount: PlatformAccount = {
        ...fetchedAccount,
        stats: {
          ...fetchedAccount.stats,
          gamesOwned: Math.max(fetchedAccount.stats.gamesOwned, steamGamesToSync.length),
          totalAchievements: Math.max(fetchedAccount.stats.totalAchievements, totalUnlocked),
          completedGames: Math.max(fetchedAccount.stats.completedGames, localCompleted),
        },
      };

      updateAccountProfileInMemory(finalAccount);
      await persistAccountToSQLite(finalAccount, steamApiKey.trim() || undefined);
      await persistGamesToSQLite(mergedGames);

      setBannerMsg({
        type: "success",
        text: `Compte Steam "${fetchedAccount.displayName}" synchronisé ! ${steamGamesToSync.length} jeux importés et sauvegardés dans SQLite.`,
      });
    } catch (err: any) {
      setBannerMsg({ type: "error", text: err.message || "Erreur lors de la synchronisation Steam." });
    } finally {
      setIsSyncingSteam(false);
      setSyncProgressText(null);
    }
  };

  return { isSyncingSteam, syncSingleSteamGame, handleConnectAndSyncSteam };
}
