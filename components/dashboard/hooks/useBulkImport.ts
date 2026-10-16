// components/dashboard/hooks/useBulkImport.ts
"use client";

import { useState } from "react";
import type { OwnedGame } from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";
import { parseBulkImportText } from "./bulkImportParser";

export interface UseBulkImportProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  syncSingleSteamGame: (user: string, game: OwnedGame) => Promise<OwnedGame>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  steamUsername?: string;
  onCloseModal?: () => void;
}

export function useBulkImport({
  ownedGames,
  onOwnedGamesChange,
  syncSingleSteamGame,
  persistGamesToSQLite,
  setBannerMsg,
  steamUsername,
  onCloseModal,
}: UseBulkImportProps) {
  const [bulkImportText, setBulkImportText] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;
    setIsBulkImporting(true);
    try {
      const discovered = parseBulkImportText(bulkImportText);

      if (discovered.length === 0) {
        setBannerMsg({
          type: "error",
          text: "Aucun jeu ou AppID détecté dans le texte collé.",
        });
        return;
      }

      let merged = mergeGamesList(ownedGames, discovered);
      onOwnedGamesChange(merged);

      if (steamUsername) {
        const toSync = discovered.slice(0, 15);
        const syncedBatch: OwnedGame[] = [];
        for (const g of toSync) {
          const s = await syncSingleSteamGame(steamUsername, g);
          syncedBatch.push(s);
        }
        merged = mergeGamesList(merged, syncedBatch);
        onOwnedGamesChange(merged);
      }

      await persistGamesToSQLite(merged);

      setBulkImportText("");
      if (onCloseModal) onCloseModal();
      setBannerMsg({
        type: "success",
        text: `${discovered.length} jeux importés dans votre bibliothèque SQLite !`,
      });
    } finally {
      setIsBulkImporting(false);
    }
  };

  return {
    bulkImportText,
    setBulkImportText,
    isBulkImporting,
    handleBulkImport,
  };
}
