import { useState } from "react";
import type {
  OwnedGame,
  PlatformType,
  GameSearchResult,
} from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";
import { mergeGamesList } from "@/components/dashboard/utils";

interface UseAddGameFlowProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  steamUsername?: string;
  syncSingleSteamGame: (
    steamUsername: string,
    game: OwnedGame
  ) => Promise<OwnedGame>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
}

export function useAddGameFlow({
  ownedGames,
  onOwnedGamesChange,
  steamUsername,
  syncSingleSteamGame,
  persistGamesToSQLite,
  setBannerMsg,
}: UseAddGameFlowProps) {
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [addGameQuery, setAddGameQuery] = useState("");
  const [addGameResults, setAddGameResults] = useState<GameSearchResult[]>([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);
  const [selectedPlatformForAdd, setSelectedPlatformForAdd] =
    useState<PlatformType>("steam");

  const handleSearchAddGame = async (q: string) => {
    setAddGameQuery(q);
    if (q.trim().length < 2) {
      setAddGameResults([]);
      return;
    }
    setIsSearchingAdd(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setAddGameResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingAdd(false);
    }
  };

  const handleAddGameToLibrary = async (item: GameSearchResult) => {
    const nowIso = new Date().toISOString();
    let newGame: OwnedGame = {
      appId: item.id,
      name: item.name,
      headerImg: item.img,
      platform: selectedPlatformForAdd,
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: nowIso,
      source: "manual",
    };

    let updatedList = mergeGamesList(ownedGames, [newGame]);
    onOwnedGamesChange(updatedList);

    if (selectedPlatformForAdd === "steam" && steamUsername) {
      newGame = await syncSingleSteamGame(steamUsername, newGame);
      updatedList = mergeGamesList(ownedGames, [newGame]);
      onOwnedGamesChange(updatedList);
    } else {
      try {
        const r = await fetch(`/api/game/${item.id}`);
        if (r.ok) {
          const details = await r.json();
          newGame = {
            ...newGame,
            totalAchievements: details.totalAchievements || 0,
          };
          updatedList = mergeGamesList(ownedGames, [newGame]);
          onOwnedGamesChange(updatedList);
        }
      } catch {}
    }

    await persistGamesToSQLite([newGame]);

    setBannerMsg({
      type: "success",
      text: `"${item.name}" (${PLATFORM_META[selectedPlatformForAdd].shortName}) ajouté à votre bibliothèque !`,
    });
  };

  return {
    isAddGameOpen,
    setIsAddGameOpen,
    addGameQuery,
    setAddGameQuery,
    addGameResults,
    setAddGameResults,
    isSearchingAdd,
    selectedPlatformForAdd,
    setSelectedPlatformForAdd,
    handleSearchAddGame,
    handleAddGameToLibrary,
  };
}
