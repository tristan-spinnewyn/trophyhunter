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

  const btnColor =
    platform === "epic"
      ? "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
      : isConnected
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      : "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20";

  return (
    <div className="flex items-center gap-1.5">
      {onSync && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${btnColor}`}
          title={isConnected ? `Synchroniser avec votre compte ${platName}` : `Configurer votre compte ${platName} pour l'auto-sync`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-sky-400" : ""}`} />
          <span className="hidden sm:inline">
            {isSyncing ? "Sync..." : isConnected ? (platform === "epic" ? "Sync Epic" : "Auto-Sync") : `Lier ${platName}`}
          </span>
        </button>
      )}

      {platform === "epic" && onOpenEpicModal && (
        <button
          type="button"
          onClick={onOpenEpicModal}
          title="Saisir ou renouveler votre code d'autorisation Epic Games (authorizationToken)"
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition"
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Code Epic</span>
        </button>
      )}

      {unlockedCount > 0 && (
        <button
          onClick={() => {
            if (window.confirm("Réinitialiser tous les succès cochés pour ce jeu ?")) {
              onReset();
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/40 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
          title="Réinitialiser la checklist"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Réinitialiser</span>
        </button>
      )}
    </div>
  );
}
