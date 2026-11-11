// app/game/[id]/hooks/useGameOwnershipToggles.ts
"use client";

import type {
  GameDetails,
  GameStatus,
  OwnedGame,
  UserGameProgress,
  User as UserType,
  PlatformType,
} from "@/lib/types";
import { DEFAULT_GAME_STATUS, assertValidGameStatus, statusChangeDates } from "@/lib/game-status/game-status.services";
import { completionDateFromInput } from "@/lib/library/completion-date";

interface UseGameOwnershipTogglesProps {
  readonly game: GameDetails | null;
  readonly activePlatform: PlatformType;
  readonly progress: UserGameProgress;
  readonly currentUser: UserType | null;
  readonly favorites: number[];
  readonly setFavorites: (favs: number[]) => void;
  readonly ownedGames: OwnedGame[];
  readonly upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<unknown>;
}

export function useGameOwnershipToggles({
  game,
  activePlatform,
  progress,
  currentUser,
  favorites,
  setFavorites,
  ownedGames,
  upsertOwnedGameInMemoryAndDb,
}: UseGameOwnershipTogglesProps) {
  const handleToggleFavorite = async () => {
    if (!game) return;
    const isFav = favorites.includes(game.id);
    const updated = isFav
      ? favorites.filter((id) => id !== game.id)
      : [...favorites, game.id];
    setFavorites(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: game.id, platform: activePlatform, isFavorite: !isFav }),
        });
      } catch (e) {
        console.error("Failed to toggle favorite:", e);
      }
    }
  };

  const handleToggleOwned = async () => {
    if (!game) return;
    const isCurrentlyOwned = ownedGames.some((g) => g.appId === game.id);
    if (isCurrentlyOwned) {
      if (currentUser) {
        await fetch(`/api/user/games?appId=${game.id}&platform=${activePlatform}`, { method: "DELETE" });
      }
    } else {
      await upsertOwnedGameInMemoryAndDb({
        appId: game.id,
        name: game.name,
        headerImg: game.headerImg,
        platform: activePlatform,
        totalAchievements: game.totalAchievements,
        unlockedCount: progress.unlockedIds.length,
        addedAt: new Date().toISOString(),
        source: "manual",
        status: DEFAULT_GAME_STATUS,
      });
    }
  };

  const findOwned = () => ownedGames.find((g) => g.appId === game?.id && g.platform === activePlatform);

  /** The page's game as saved in the collection, keeping what the collection already knows. */
  const toOwnedGame = (current: GameDetails, existing: OwnedGame | undefined, changes: Partial<OwnedGame>): OwnedGame => ({
    appId: current.id,
    name: existing?.name || current.name,
    headerImg: existing?.headerImg || current.headerImg,
    platform: activePlatform,
    totalAchievements: existing?.totalAchievements || current.totalAchievements,
    unlockedCount: Math.max(existing?.unlockedCount || 0, progress.unlockedIds.length),
    playtimeHours: existing?.playtimeHours,
    lastPlayed: existing?.lastPlayed,
    addedAt: existing?.addedAt || new Date().toISOString(),
    source: existing?.source || "manual",
    status: existing?.status,
    completedAt: existing?.completedAt,
    abandonedAt: existing?.abandonedAt,
    ...changes,
  });

  const handleChangeGameStatus = async (status: GameStatus) => {
    if (!game) return;
    const validStatus = assertValidGameStatus(status);
    const existing = findOwned();
    const changedAt = new Date().toISOString();
    await upsertOwnedGameInMemoryAndDb(
      toOwnedGame(game, existing, { status: validStatus, ...statusChangeDates(validStatus, changedAt, existing) })
    );
  };

  /** Sets by hand the day a finished game was finished; ignores days that cannot be one. */
  const handleChangeCompletedAt = async (day: string) => {
    const existing = findOwned();
    const completedAt = completionDateFromInput(day, new Date());
    if (!game || !existing || !completedAt) return;
    await upsertOwnedGameInMemoryAndDb(toOwnedGame(game, existing, { completedAt }));
  };

  return { handleToggleFavorite, handleToggleOwned, handleChangeGameStatus, handleChangeCompletedAt };
}
