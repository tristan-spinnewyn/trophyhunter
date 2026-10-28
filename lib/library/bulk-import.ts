// components/dashboard/hooks/bulkImportParser.ts

import type { OwnedGame } from "@/lib/types";

export function parseBulkImportText(text: string): OwnedGame[] {
  const discovered: OwnedGame[] = [];
  const nowIso = new Date().toISOString();

  // 1. Check if it contains Steam's data-profile-gameslist JSON or rgGames JSON
  const decodedText = text
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
    return discovered;
  }

  // 2. Extract any Steam AppIDs from URLs or comma/space-separated numbers
  const idMatches = [
    ...text.matchAll(/(?:app\/|\b)(\d{3,8})\b/g),
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

  return discovered;
}
