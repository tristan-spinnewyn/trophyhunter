// components/dashboard/hooks/useEpicAuthModalState.ts
"use client";

import { useState } from "react";
import { buildEpicAuthHeaders } from "@/lib/epic/auth-input";
import type { OwnedGame } from "@/lib/types";

interface UseEpicAuthModalStateProps {
  handleConnectAndSyncEpic: (overrideUser?: string, codeOverride?: string) => Promise<void>;
  syncEpicGameWithData: (g: OwnedGame, data: any) => Promise<void>;
}

export function useEpicAuthModalState({
  handleConnectAndSyncEpic,
  syncEpicGameWithData,
}: UseEpicAuthModalStateProps) {
  const [isEpicAuthModalOpen, setIsEpicAuthModalOpen] = useState(false);
  const [epicAuthModalGame, setEpicAuthModalGame] = useState<OwnedGame | null>(null);
  const [epicAuthModalError, setEpicAuthModalError] = useState<string | null>(null);
  const [isEpicModalSyncing, setIsEpicModalSyncing] = useState(false);

  const openEpicAuthModalForLibrary = () => {
    setEpicAuthModalGame(null);
    setEpicAuthModalError(null);
    setIsEpicAuthModalOpen(true);
  };

  const closeEpicAuthModal = () => {
    setIsEpicAuthModalOpen(false);
    setEpicAuthModalGame(null);
    setEpicAuthModalError(null);
  };

  const handleEpicModalSubmit = async (token: string) => {
    setIsEpicModalSyncing(true);
    setEpicAuthModalError(null);

    if (!epicAuthModalGame) {
      try {
        await handleConnectAndSyncEpic(undefined, token);
        setIsEpicAuthModalOpen(false);
      } catch (err: any) {
        setEpicAuthModalError(err.message || "Erreur de synchronisation Epic Games.");
      } finally {
        setIsEpicModalSyncing(false);
      }
      return;
    }

    try {
      const res = await fetch(
        `/api/sync?platform=epic&appId=${epicAuthModalGame.appId}&name=${encodeURIComponent(
          epicAuthModalGame.name
        )}`,
        { headers: buildEpicAuthHeaders(token) }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Code d'autorisation Epic Games invalide.");
      }
      await syncEpicGameWithData(epicAuthModalGame, data);
      setIsEpicAuthModalOpen(false);
      setEpicAuthModalGame(null);
    } catch (err: any) {
      setEpicAuthModalError(err.message || "Erreur de validation du code Epic.");
    } finally {
      setIsEpicModalSyncing(false);
    }
  };

  return {
    isEpicAuthModalOpen,
    setIsEpicAuthModalOpen,
    epicAuthModalGame,
    setEpicAuthModalGame,
    epicAuthModalError,
    setEpicAuthModalError,
    isEpicModalSyncing,
    openEpicAuthModalForLibrary,
    closeEpicAuthModal,
    handleEpicModalSubmit,
  };
}
