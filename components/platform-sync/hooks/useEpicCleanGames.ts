// components/platform-sync/hooks/useEpicCleanGames.ts

import type { OwnedGame } from "@/lib/types";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

interface UseEpicCleanGamesProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  persistGames: (games: OwnedGame[], replacePlatform?: "epic") => Promise<void>;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function useEpicCleanGames({
  ownedGames,
  onOwnedGamesChange,
  persistGames,
  setBannerMsg,
}: UseEpicCleanGamesProps) {
  const confirm = useConfirm();
  const handleCleanEpicGames = async (
    epicNoAchCount: number,
    epicWithAchCount: number
  ) => {
    const confirmed = await confirm({
      title: `Retirer ${epicNoAchCount} jeux Epic sans succès ?`,
      message: `Seuls tes ${epicWithAchCount} jeux Epic avec succès resteront dans ta collection.`,
      confirmLabel: "Retirer",
    });
    if (!confirmed) return;
    const filtered = ownedGames.filter(
      (g) => !(g.platform === "epic" && (g.totalAchievements === 0 || !g.totalAchievements))
    );
    onOwnedGamesChange(filtered);
    await persistGames(
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
