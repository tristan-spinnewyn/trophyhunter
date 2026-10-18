// components/dashboard/hooks/useEpicSync.ts
import { useState } from "react";
import type { UseEpicSyncProps } from "./useEpicSync.types";
import { useEpicEnrichment } from "./useEpicEnrichment";
import { useEpicCleanGames } from "./useEpicCleanGames";
import { useEpicProfileConnect } from "./useEpicProfileConnect";

export function useEpicSync({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  setSyncProgressText,
  epicInput,
  epicCode,
  setEpicCode,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
  onRequireToken,
}: UseEpicSyncProps) {
  const [isSyncingEpic, setIsSyncingEpic] = useState(false);

  const { enrichEpicGamesAchievements } = useEpicEnrichment({
    ownedGames, onOwnedGamesChange, setBannerMsg, setSyncProgressText,
    setIsSyncingEpic, isSyncingEpic, persistGamesToSQLite,
  });

  const { handleCleanEpicGames } = useEpicCleanGames({
    ownedGames, onOwnedGamesChange, persistGamesToSQLite, setBannerMsg,
  });

  const { handleConnectAndSyncEpic } = useEpicProfileConnect({
    ownedGames, onOwnedGamesChange, setBannerMsg, setSyncProgressText,
    setIsSyncingEpic, epicInput, epicCode, setEpicCode,
    updateAccountProfileInMemory, persistAccountToSQLite, persistGamesToSQLite,
    enrichEpicGamesAchievements, onRequireToken,
  });

  const handleScanEpicAchievements = async () => {
    const epicSubset = ownedGames.filter((g) => g.platform === "epic");
    if (epicSubset.length === 0) {
      setBannerMsg({ type: "error", text: "Aucun jeu Epic dans votre bibliothèque pour l'instant." });
      return;
    }
    setBannerMsg({ type: "success", text: `Actualisation en arrière-plan des succès pour ${epicSubset.length} jeux Epic...` });
    const finalList = await enrichEpicGamesAchievements(epicSubset, ownedGames, true);
    const withAch = finalList.filter((g) => g.platform === "epic" && (g.totalAchievements || 0) > 0).length;
    const totalUnlocked = finalList
      .filter((g) => g.platform === "epic")
      .reduce((acc, g) => acc + (g.unlockedCount || 0), 0);
    setBannerMsg({
      type: "success",
      text: `Terminé ! ${withAch}/${epicSubset.length} jeux Epic avec succès (${totalUnlocked} trophées débloqués).`,
    });
  };

  return {
    isSyncingEpic,
    enrichEpicGamesAchievements,
    handleConnectAndSyncEpic,
    handleScanEpicAchievements,
    handleCleanEpicGames,
  };
}

