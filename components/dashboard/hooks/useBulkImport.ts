"use client";

import { useState } from "react";
import type { OwnedGame } from "@/lib/types";

function mergeGamesList(base: OwnedGame[], incoming: OwnedGame[]): OwnedGame[] {
  const map = new Map<string, OwnedGame>();
  for (const g of base) {
    map.set(`${g.platform}_${g.appId}`, g);
  }
  for (const g of incoming) {
    const key = `${g.platform}_${g.appId}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        ...g,
        totalAchievements:
          g.totalAchievements > 0
            ? g.totalAchievements
            : existing.totalAchievements,
        unlockedCount: Math.max(g.unlockedCount || 0, existing.unlockedCount || 0),
        playtimeHours: g.playtimeHours ?? existing.playtimeHours,
        addedAt: existing.addedAt || g.addedAt,
      });
    } else {
      map.set(key, g);
    }
  }
  return Array.from(map.values());
}

interface UseBulkImportProps {
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
      const discovered: OwnedGame[] = [];
      const nowIso = new Date().toISOString();

      // 1. Check if it contains Steam's data-profile-gameslist JSON or rgGames JSON
      const decodedText = bulkImportText
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");

      const appJsonMatches = [
        ...decodedText.matchAll(
          /"appid"\s*:\s*(\d+)\s*,\s*"name"\s*:\s*"([^"]+)"/g
        ),
      ];

      if (appJsonMatches.length > 0) {
        for (const m of appJsonMatches) {
          const appId = parseInt(m[1], 10);
          const name = m[2].replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
            String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16))
          );
          if (appId) {
            discovered.push({
              appId,
              name,
              headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
              platform: "steam",
              totalAchievements: 0,
              unlockedCount: 0,
              addedAt: nowIso,
              source: "steam-import",
            });
          }
        }
      } else {
        // 2. Extract any Steam AppIDs from URLs or comma/space-separated numbers
        const idMatches = [
          ...bulkImportText.matchAll(/(?:app\/|\b)(\d{3,8})\b/g),
        ].map((m) => parseInt(m[1], 10));
        const uniqueIds = [...new Set(idMatches)].slice(0, 60);

        for (const appId of uniqueIds) {
          discovered.push({
            appId,
            name: `Jeu Steam #${appId}`,
            headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
            platform: "steam",
            totalAchievements: 0,
            unlockedCount: 0,
            addedAt: nowIso,
            source: "steam-import",
          });
        }
      }

      if (discovered.length === 0) {
        setBannerMsg({
          type: "error",
          text: "Aucun jeu ou AppID détecté dans le texte collé.",
        });
        return;
      }

      let merged = mergeGamesList(ownedGames, discovered);
      onOwnedGamesChange(merged);

      // Sync the newly imported games if Steam user is connected (up to 15 immediately so it stays fast)
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
