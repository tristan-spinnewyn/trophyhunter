// app/game/[id]/hooks/useGameEpicSync.ts
"use client";

import { useState } from "react";
import { buildEpicAuthHeaders } from "@/lib/epic/auth-headers";
import type { UseGameSyncActionParams } from "./useGameSyncAction.types";
import { applyGameEpicSyncData } from "./gameEpicSyncData";
import { saveProgressApi } from "./progressApi";

export function useGameEpicSync({
  game,
  setGame,
  owned,
  progress,
  setProgress,
  accountProfile,
  currentUser,
  upsertOwnedGameInMemoryAndDb,
  setIsSyncing,
  setSyncNotice,
}: Omit<UseGameSyncActionParams, "activePlatform" | "steamUser">) {
  const [isEpicAuthModalOpen, setIsEpicAuthModalOpen] = useState(false);
  const [epicAuthModalError, setEpicAuthModalError] = useState<string | null>(null);

  const executeEpicSync = async (userToken?: string) => {
    if (!game) return;
    const epicAccount = accountProfile.accounts.epic;
    if (!epicAccount && !userToken) {
      setEpicAuthModalError(null);
      setIsEpicAuthModalOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const userParam = epicAccount?.username ? `&user=${encodeURIComponent(epicAccount.username)}` : "";
      const res = await fetch(`/api/sync?platform=epic&appId=${game.id}&name=${encodeURIComponent(game.name)}${userParam}`, {
        headers: buildEpicAuthHeaders(userToken),
      });
      const data = await res.json();

      if (data.requiresToken || (!data.success && data.error?.includes("authorizationToken"))) {
        setEpicAuthModalError(data.error || null);
        setIsEpicAuthModalOpen(true);
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Échec de la synchronisation Epic Games.");

      const { newUnlockedIds, resolvedTotal, updatedProgress } = await applyGameEpicSyncData({
        data, game, setGame, owned, progress, setProgress, upsertOwnedGameInMemoryAndDb,
      });

      if (currentUser) await saveProgressApi(game.id, "epic", updatedProgress);

      setSyncNotice({ type: "success", msg: `Synchronisation Epic réussie : ${newUnlockedIds.length}/${resolvedTotal} succès débloqués !` });
      setIsEpicAuthModalOpen(false);
      setEpicAuthModalError(null);
    } catch (err: any) {
      setSyncNotice({ type: "error", msg: err.message || "Erreur de synchronisation Epic Games." });
      if (userToken) setEpicAuthModalError(err.message || "Erreur de validation du code Epic.");
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isEpicAuthModalOpen,
    setIsEpicAuthModalOpen,
    epicAuthModalError,
    openEpicAuthModal: () => { setEpicAuthModalError(null); setIsEpicAuthModalOpen(true); },
    handleEpicAuthSubmit: (token: string) => executeEpicSync(token),
    executeEpicSync,
  };
}
