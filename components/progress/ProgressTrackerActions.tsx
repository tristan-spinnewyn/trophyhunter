// components/progress/ProgressTrackerActions.tsx
"use client";

import type { PlatformType } from "@/lib/types";
import { isManualPlatform } from "@/lib/platforms";
import { RefreshCw, KeyRound, RotateCcw } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

interface ActionsProps {
  unlockedCount: number;
  onReset: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  hasSteamUser?: boolean;
  platform?: PlatformType;
  platformConnected?: boolean;
  onOpenEpicModal?: () => void;
}

export function ProgressTrackerActions({
  unlockedCount,
  onReset,
  onSync,
  isSyncing = false,
  hasSteamUser = false,
  platform = "steam",
  platformConnected,
  onOpenEpicModal,
}: ActionsProps) {
  const confirm = useConfirm();
  const isConnected = platformConnected ?? (platform === "epic" ? true : hasSteamUser);
  const platName = platform === "epic" ? "Epic Games" : platform === "xbox" ? "Xbox" : platform === "gog" ? "GOG" : "Steam";

  const buttonClass =
    "flex h-8 items-center gap-1.5 rounded-control border border-edge px-2.5 text-xs font-medium text-paper-dim transition hover:bg-edge hover:text-paper disabled:opacity-60";

  return (
    <div className="flex items-center gap-1">
      {onSync && !isManualPlatform(platform) && (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className={buttonClass}
          title={isConnected ? `Synchroniser avec votre compte ${platName}` : `Configurer votre compte ${platName} pour l'auto-sync`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-lamp-bright" : ""}`} />
          <span>
            {isSyncing ? "Sync…" : isConnected ? "Synchroniser" : `Lier ${platName}`}
          </span>
        </button>
      )}

      {platform === "epic" && onOpenEpicModal && (
        <button
          type="button"
          onClick={onOpenEpicModal}
          title="Saisir ou renouveler votre code d'autorisation Epic Games (authorizationToken)"
          className={buttonClass}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Code Epic</span>
        </button>
      )}

      {unlockedCount > 0 && (
        <button
          type="button"
          onClick={async () => {
            const confirmed = await confirm({
              title: "Réinitialiser la checklist ?",
              message: "Tous les succès cochés pour ce jeu seront décochés.",
              confirmLabel: "Réinitialiser",
            });
            if (confirmed) onReset();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-control text-faint transition hover:bg-edge hover:text-danger"
          title="Réinitialiser la checklist"
          aria-label="Réinitialiser la checklist"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
