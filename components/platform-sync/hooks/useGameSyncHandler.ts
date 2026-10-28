// components/platform-sync/hooks/useGameSyncHandler.ts
import type { PlatformType, OwnedGame, UserAccountProfile } from "@/lib/types";
import { mergeGamesList } from "@/lib/library/game-list";

interface EpicSyncResponseData {
  readonly success?: boolean;
  readonly requiresToken?: boolean;
  readonly error?: string;
  readonly count?: number;
  readonly unlockedCount?: number;
  readonly totalAchievements?: number;
}

interface UseGameSyncHandlerProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  removeGame: (appId: number, platform: PlatformType) => Promise<void>;
  persistGames: (games: OwnedGame[]) => Promise<void>;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  syncSingleSteamGame: (username: string, game: OwnedGame) => Promise<OwnedGame>;
  enrichEpicGamesAchievements: (epicGamesList: OwnedGame[], allCurrentGames: OwnedGame[], forceAll?: boolean) => Promise<OwnedGame[]>;
  onEpicTokenRequired: (game: OwnedGame, error: string | null) => void;
}

export function useGameSyncHandler({
  accountProfile,
  ownedGames,
  onOwnedGamesChange,
  removeGame,
  persistGames,
  setBannerMsg,
  syncSingleSteamGame,
  enrichEpicGamesAchievements,
  onEpicTokenRequired,
}: UseGameSyncHandlerProps) {
  const handleRemoveGame = async (appId: number, platform: PlatformType) => {
    const next = ownedGames.filter((item) => !(item.appId === appId && item.platform === platform));
    onOwnedGamesChange(next);
    await removeGame(appId, platform);
  };

  const syncEpicGameWithData = async (g: OwnedGame, data: EpicSyncResponseData) => {
    const updatedGame: OwnedGame = {
      ...g,
      unlockedCount: data.count ?? data.unlockedCount ?? g.unlockedCount,
      totalAchievements: data.totalAchievements || g.totalAchievements,
    };
    const next = mergeGamesList(ownedGames, [updatedGame]);
    onOwnedGamesChange(next);
    await persistGames([updatedGame]);
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
      await persistGames([synced]);
      setBannerMsg({
        type: "success",
        text: `Succès de "${synced.name}" synchronisés (${synced.unlockedCount}/${synced.totalAchievements}) !`,
      });
    } else if (g.platform === "epic") {
      try {
        const res = await fetch(`/api/sync?platform=epic&appId=${g.appId}&name=${encodeURIComponent(g.name)}`);
        const data: EpicSyncResponseData | null = res.ok ? await res.json() : null;

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
      const next = await enrichEpicGamesAchievements([g], ownedGames, true);
      const updatedGame = next.find((item) => item.appId === g.appId && item.platform === "epic");
      setBannerMsg({
        type: "success",
        text: `Succès de "${g.name}" actualisés (${updatedGame?.unlockedCount || 0}/${updatedGame?.totalAchievements || 0}) !`,
      });
    }
  };

  return { handleRemoveGame, syncEpicGameWithData, handleSyncGame };
}

