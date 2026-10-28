// components/platform-sync/hooks/steamAchievementsBatch.ts

import type { OwnedGame } from "@/lib/types";

export async function syncSteamAchievementsBatch(
  username: string,
  steamGames: OwnedGame[],
  syncSingleSteamGame: (user: string, game: OwnedGame) => Promise<OwnedGame>,
  onProgress: (text: string) => void
): Promise<{ updatedGames: OwnedGame[]; totalUnlocked: number }> {
  let totalUnlocked = 0;
  const updatedGames: OwnedGame[] = [];

  for (let i = 0; i < steamGames.length; i++) {
    const g = steamGames[i];
    onProgress(`Synchronisation des succès (${i + 1}/${steamGames.length}) : ${g.name}...`);
    const syncedGame = await syncSingleSteamGame(username, g);
    totalUnlocked += syncedGame.unlockedCount;
    updatedGames.push(syncedGame);
  }

  return { updatedGames, totalUnlocked };
}
