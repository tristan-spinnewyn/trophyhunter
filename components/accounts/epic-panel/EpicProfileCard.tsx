// components/accounts/epic-panel/EpicProfileCard.tsx

import { Trophy, Edit3, Unlink } from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

interface EpicProfileCardProps {
  epicAccount?: UserAccountProfile["accounts"]["epic"];
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
}

export function EpicProfileCard({
  epicAccount,
  openEditPlatform,
  handleDisconnectPlatform,
}: EpicProfileCardProps) {
  return (
    <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 text-purple-400">
          <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>
      </div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-white truncate">
            {epicAccount?.displayName || "Compte Epic Games"}
          </h2>
          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[11px] font-bold text-purple-300">
            Epic Games Store
          </span>
        </div>

        <p className="text-xs text-slate-400 truncate">
          Pseudo Epic :{" "}
          <span className="font-semibold text-slate-200">
            {epicAccount?.username || "Non configuré"}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300">
            <Trophy className="h-3.5 w-3.5" />
            {epicAccount?.stats.completedGames || 0} Platine(s)
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
            {epicAccount?.stats.totalAchievements || 0} Succès XP
          </div>
          {epicAccount?.lastSyncedAt && (
            <span className="text-[11px] text-slate-500">
              Dernière sync :{" "}
              {new Date(epicAccount.lastSyncedAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => openEditPlatform("epic")}
            className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Édition manuelle
          </button>
          {epicAccount && (
            <>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleDisconnectPlatform("epic")}
                className="text-[11px] font-semibold text-red-400/80 hover:text-red-300 flex items-center gap-1"
              >
                <Unlink className="h-3 w-3" />
                Déconnecter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
