// components/dashboard/hooks/useGameSyncHandler.ts

import type { PlatformType, OwnedGame, UserAccountProfile } from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";

interface UseGameSyncHandlerProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  removeGameFromSQLite: (appId: number, platform: PlatformType) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  syncSingleSteamGame: (username: string, game: OwnedGame) => Promise<OwnedGame>;
  enrichEpicGamesAchievements: (epicGamesList: OwnedGame[], allCurrentGames: OwnedGame[]) => Promise<OwnedGame[]>;
  onEpicTokenRequired: (game: OwnedGame, error: string | null) => void;
}

export function useGameSyncHandler({
  accountProfile,
  ownedGames,
  onOwnedGamesChange,
  removeGameFromSQLite,
  persistGamesToSQLite,
  setBannerMsg,
  syncSingleSteamGame,
  enrichEpicGamesAchievements,
  onEpicTokenRequired,
}: UseGameSyncHandlerProps) {
  const handleRemoveGame = async (appId: number, platform: PlatformType) => {
    const next = ownedGames.filter((item) => !(item.appId === appId && item.platform === platform));
    onOwnedGamesChange(next);
    await removeGameFromSQLite(appId, platform);
  };

  const syncEpicGameWithData = async (g: OwnedGame, data: any) => {
    const updatedGame: OwnedGame = {
      ...g,
      unlockedCount: data.count ?? data.unlockedCount ?? g.unlockedCount,
      totalAchievements: data.totalAchievements ?? g.totalAchievements,
    };
    const next = mergeGamesList(ownedGames, [updatedGame]);
    onOwnedGamesChange(next);
    await persistGamesToSQLite([updatedGame]);
    setBannerMsg({
      type: "success",
      text: `Succès Epic de "${g.name}" synchronisés (${updatedGame.unlockedCount}/${updatedGame.totalAchievements}) !`,
    });
  };

  const handleSyncGame = async (g: OwnedGame) => {
    const steamAccount = accountProfile.accounts.steam;
    if (g.platform === "steam" && steamAccount?.username) {
      const synced = await syncSingleSteamGame(steamAccount.username, g);
      const next = mergeGamesList(ownedGames, [synced]);
      onOwnedGamesChange(next);
      await persistGamesToSQLite([synced]);
      setBannerMsg({
        type: "success",
        text: `Succès de "${synced.name}" synchronisés (${synced.unlockedCount}/${synced.totalAchievements}) !`,
      });
    } else if (g.platform === "epic") {
      try {
        const res = await fetch(`/api/sync?platform=epic&appId=${g.appId}&name=${encodeURIComponent(g.name)}`);
        const data = res.ok ? await res.json() : null;

        if (data?.requiresToken) {
          onEpicTokenRequired(g, data.error || null);
          return;
        }

        if (data && data.success) {
          await syncEpicGameWithData(g, data);
          return;
        }
      } catch (e) {
        console.warn("Epic single sync error, falling back:", e);
      }
      const next = await enrichEpicGamesAchievements([{ ...g, totalAchievements: 0 }], ownedGames);
      const updatedGame = next.find((item) => item.appId === g.appId && item.platform === "epic");
      setBannerMsg({
        type: "success",
        text: `Succès de "${g.name}" actualisés (${updatedGame?.totalAchievements || 0} succès détectés) !`,
      });
    }
  };

  return { handleRemoveGame, syncEpicGameWithData, handleSyncGame };
}
