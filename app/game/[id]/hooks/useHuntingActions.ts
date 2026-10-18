// app/game/[id]/hooks/useHuntingActions.ts
"use client";

import { useMemo } from "react";
import type { GameDetails, UserGameProgress, User as UserType, PlatformType } from "@/lib/types";
import { type GameHuntingOverride, MaxPinnedTargetsExceededError } from "@/lib/hunting/hunting.types";
import {
  togglePinnedAchievement,
  clearUnlockedPinnedAchievements,
  getPinnedAchievementsList,
} from "@/lib/hunting/pinned-targets.services";
import { computeGameHuntingMeta } from "@/lib/hunting/hunting-meta.services";
import { saveProgressApi } from "./progressApi";

interface UseHuntingActionsParams {
  readonly game: GameDetails | null;
  readonly activePlatform: PlatformType;
  readonly progress: UserGameProgress;
  readonly setProgress: (p: UserGameProgress) => void;
  readonly currentUser: UserType | null;
  readonly setSyncNotice: (n: { type: "success" | "error"; msg: string } | null) => void;
}

export function useHuntingActions({
  game,
  activePlatform,
  progress,
  setProgress,
  currentUser,
  setSyncNotice,
}: UseHuntingActionsParams) {
  const huntingMeta = useMemo(
    () => computeGameHuntingMeta(game?.achievements ?? [], progress.huntingMeta),
    [game?.achievements, progress.huntingMeta]
  );

  const pinnedAchievements = useMemo(
    () => getPinnedAchievementsList(game?.achievements ?? [], progress.pinnedIds),
    [game?.achievements, progress.pinnedIds]
  );

  const persistProgress = async (updated: UserGameProgress): Promise<void> => {
    if (!game) return;
    setProgress(updated);
    if (currentUser) await saveProgressApi(game.id, activePlatform, updated);
  };

  const handleTogglePinAchievement = async (achId: string): Promise<void> => {
    if (!game) return;
    try {
      const nextPinnedIds = togglePinnedAchievement(progress.pinnedIds, achId);
      await persistProgress({ ...progress, pinnedIds: nextPinnedIds });
    } catch (err: unknown) {
      if (err instanceof MaxPinnedTargetsExceededError) {
        setSyncNotice({
          type: "error",
          msg: `Maximum ${err.maxAllowed} succès épinglés en mode Chasse Active.`,
        });
      }
    }
  };

  const handleClearUnlockedPins = async (): Promise<void> => {
    const nextPinnedIds = clearUnlockedPinnedAchievements(progress.pinnedIds, progress.unlockedIds);
    await persistProgress({ ...progress, pinnedIds: nextPinnedIds });
  };

  const handleClearAllPins = async (): Promise<void> => {
    await persistProgress({ ...progress, pinnedIds: [] });
  };

  const handleSaveHuntingOverride = async (override: GameHuntingOverride | undefined): Promise<void> => {
    await persistProgress({ ...progress, huntingMeta: override });
  };

  return {
    huntingMeta,
    pinnedAchievements,
    handleTogglePinAchievement,
    handleClearUnlockedPins,
    handleClearAllPins,
    handleSaveHuntingOverride,
  };
}
