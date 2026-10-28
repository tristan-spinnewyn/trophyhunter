// components/progress/ProgressTrackerActions.tsx
"use client";

import { RefreshCw, KeyRound, RotateCcw } from "lucide-react";

interface ActionsProps {
  unlockedCount: number;
  onReset: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  hasSteamUser?: boolean;
  platform?: "steam" | "epic" | "xbox" | "gog";
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
  const isConnected = platformConnected ?? (platform === "epic" ? true : hasSteamUser);
  const platName = platform === "epic" ? "Epic Games" : platform === "xbox" ? "Xbox" : platform === "gog" ? "GOG" : "Steam";

  const buttonClass =
    "flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-60";

  return (
    <div className="flex items-center gap-1">
      {onSync && (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className={buttonClass}
          title={isConnected ? `Synchroniser avec votre compte ${platName}` : `Configurer votre compte ${platName} pour l'auto-sync`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-sky-400" : ""}`} />
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
          onClick={() => {
            if (window.confirm("Réinitialiser tous les succès cochés pour ce jeu ?")) {
              onReset();
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
          title="Réinitialiser la checklist"
          aria-label="Réinitialiser la checklist"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
