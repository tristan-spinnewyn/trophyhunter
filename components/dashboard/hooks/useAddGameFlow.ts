// components/dashboard/hooks/useAddGameFlow.ts
"use client";

import { useState } from "react";
import type { OwnedGame, PlatformType, GameSearchResult } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { mergeGamesList } from "@/components/dashboard/utils";
import type { UseAddGameFlowProps } from "./useAddGameFlow.types";
import { useAddGameSearch } from "./useAddGameSearch";

export function useAddGameFlow({
  ownedGames,
  onOwnedGamesChange,
  steamUsername,
  syncSingleSteamGame,
  persistGamesToSQLite,
  setBannerMsg,
}: UseAddGameFlowProps) {
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [selectedPlatformForAdd, setSelectedPlatformForAdd] =
    useState<PlatformType>("steam");

  const {
    addGameQuery,
    setAddGameQuery,
    addGameResults,
    setAddGameResults,
    isSearchingAdd,
    handleSearchAddGame,
  } = useAddGameSearch();

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
