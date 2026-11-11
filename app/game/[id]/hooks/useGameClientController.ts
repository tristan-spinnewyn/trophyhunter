// app/game/[id]/hooks/useGameClientController.ts
"use client";

import { useUserData } from "@/context/UserDataContext";
import type { PlatformType } from "@/lib/types";
import { useGameDetails } from "./useGameDetails";
import { useGameProgressActions } from "./useGameProgressActions";
import { useAchievementFilters } from "./useAchievementFilters";
import { useHuntingActions } from "./useHuntingActions";
import { useGameReview } from "./useGameReview";
import { useGameResumeNote } from "./useGameResumeNote";
import { useGameSeries } from "@/components/series/useGameSeries";

export function useGameClientController(id: string) {
  const appId = parseInt(id, 10);
  const {
    currentUser, ownedGames, accountProfile, steamUser,
    favorites, setFavorites, upsertOwnedGameInMemoryAndDb, setOwnedGames, wishlistIds, setWishlistIds,
  } = useUserData();

  const owned = ownedGames.find((g) => g.appId === appId);
  const activePlatform: PlatformType = (owned?.platform as PlatformType) || "steam";

  const details = useGameDetails({
    appId, owned, activePlatform, currentUser, accountProfile,
    steamUser, upsertOwnedGameInMemoryAndDb,
  });

  const actions = useGameProgressActions({
    game: details.game, setGame: details.setGame, owned, activePlatform,
    progress: details.progress, setProgress: details.setProgress,
    accountProfile, steamUser, currentUser, favorites, setFavorites,
    ownedGames, upsertOwnedGameInMemoryAndDb,
    setIsSyncing: details.setIsSyncing, setSyncNotice: details.setSyncNotice,
  });

  const hunting = useHuntingActions({
    game: details.game,
    activePlatform,
    progress: details.progress,
    setProgress: details.setProgress,
    currentUser,
    setSyncNotice: details.setSyncNotice,
  });

  const review = useGameReview({ owned, currentUser, setOwnedGames });
  const resumeNote = useGameResumeNote({ owned, currentUser, setOwnedGames });

  const series = useGameSeries(
    owned ? { platform: owned.platform, appId: owned.appId } : undefined,
    Boolean(currentUser),
    (wishedId) => setWishlistIds((prev) => (prev.includes(wishedId) ? prev : [...prev, wishedId]))
  );

  const filters = useAchievementFilters(details.game?.achievements, details.progress);

  return {
    appId, owned, activePlatform, favorites, ownedGames, accountProfile, steamUser, wishlistIds,
    gameSeries: series.series, handleWishForSeriesGame: series.wishFor,
    ...details,
    ...actions,
    ...hunting,
    ...review,
    ...resumeNote,
    ...filters,
  };
}
