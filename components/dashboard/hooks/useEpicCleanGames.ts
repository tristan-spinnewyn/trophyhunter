// components/dashboard/hooks/useEpicCleanGames.ts

import type { OwnedGame } from "@/lib/types";

interface UseEpicCleanGamesProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  persistGamesToSQLite: (games: OwnedGame[], replacePlatform?: "epic") => Promise<void>;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function useEpicCleanGames({
  ownedGames,
  onOwnedGamesChange,
  persistGamesToSQLite,
  setBannerMsg,
}: UseEpicCleanGamesProps) {
  const handleCleanEpicGames = async (
    epicNoAchCount: number,
    epicWithAchCount: number
  ) => {
    if (
      !confirm(
        `Voulez-vous masquer les ${epicNoAchCount} jeux Epic qui ne possèdent AUCUN succès pour ne garder que vos ${epicWithAchCount} jeux chassables ?`
      )
    ) {
      return;
    }
    const filtered = ownedGames.filter(
      (g) => !(g.platform === "epic" && (g.totalAchievements === 0 || !g.totalAchievements))
    );
    onOwnedGamesChange(filtered);
    await persistGamesToSQLite(
      filtered.filter((g) => g.platform === "epic"),
      "epic"
    );
    setBannerMsg({
      type: "success",
      text: `Nettoyage terminé : ${epicNoAchCount} jeux sans succès ont été retirés.`,
    });
  };

  return { handleCleanEpicGames };
}
