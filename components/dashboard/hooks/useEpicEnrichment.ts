// components/dashboard/hooks/useEpicEnrichment.ts
import { useRef, useEffect } from "react";
import type { OwnedGame } from "@/lib/types";
import { mergeGamesList } from "@/lib/library/game-list";
import { resolveSingleEpicGame } from "./epicEnrichmentResolver";

interface UseEpicEnrichmentProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  setSyncProgressText: (text: string | null) => void;
  setIsSyncingEpic: (val: boolean) => void;
  isSyncingEpic: boolean;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
}

export function useEpicEnrichment({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  setSyncProgressText,
  setIsSyncingEpic,
  isSyncingEpic,
  persistGamesToSQLite,
}: UseEpicEnrichmentProps) {
  const hasAutoEnrichedEpicRef = useRef(false);

  const enrichEpicGamesAchievements = async (
    epicGamesList: OwnedGame[],
    allCurrentGames: OwnedGame[],
    forceAll = false
  ): Promise<OwnedGame[]> => {
    const gamesToResolve = epicGamesList.filter(
      (g) =>
        g.platform === "epic" &&
        (forceAll || (g.totalAchievements || 0) === 0) &&
        g.name &&
        !g.name.startsWith("Epic Game (") &&
        !g.name.startsWith("Jeu Epic (")
    );
    if (gamesToResolve.length === 0) return allCurrentGames;

    setIsSyncingEpic(true);
    let workingGames = [...allCurrentGames];
    const BATCH_SIZE = 5;

    try {
      for (let i = 0; i < gamesToResolve.length; i += BATCH_SIZE) {
        const batch = gamesToResolve.slice(i, i + BATCH_SIZE);
        setSyncProgressText(`Synchronisation des succès Epic Games (${i + 1}/${gamesToResolve.length})...`);
        const resolvedBatch = await Promise.all(batch.map(resolveSingleEpicGame));
        workingGames = mergeGamesList(workingGames, resolvedBatch);
        onOwnedGamesChange(workingGames);
        await persistGamesToSQLite(resolvedBatch);
      }
    } finally {
      setSyncProgressText(null);
      setIsSyncingEpic(false);
    }
    return workingGames;
  };

  useEffect(() => {
    if (hasAutoEnrichedEpicRef.current || isSyncingEpic) return;
    const epicGames = ownedGames.filter((g) => g.platform === "epic");
    if (epicGames.length > 0 && epicGames.every((g) => (g.totalAchievements || 0) === 0)) {
      hasAutoEnrichedEpicRef.current = true;
      enrichEpicGamesAchievements(epicGames, ownedGames).then((finalList) => {
        const withAch = finalList.filter((g) => g.platform === "epic" && (g.totalAchievements || 0) > 0).length;
        if (withAch > 0) {
          setBannerMsg({
            type: "success",
            text: `Succès Epic Games détectés et enregistrés dans SQLite pour ${withAch} jeu(x) !`,
          });
        }
      });
    }
  }, [ownedGames]);

  return { enrichEpicGamesAchievements, hasAutoEnrichedEpicRef };
}

