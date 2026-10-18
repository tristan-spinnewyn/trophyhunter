// components/dashboard/gog-panel/GogProfileCard.tsx
import { Gamepad2, Trophy, Edit3, Unlink } from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

interface GogProfileCardProps {
  readonly gogAccount?: UserAccountProfile["accounts"]["gog"];
  readonly openEditPlatform: (plat: PlatformType) => void;
  readonly handleDisconnectPlatform: (plat: PlatformType) => void;
}

export function GogProfileCard({
  gogAccount,
  openEditPlatform,
  handleDisconnectPlatform,
}: GogProfileCardProps) {
  return (
    <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        {gogAccount?.avatarUrl ? (
          <img
            src={gogAccount.avatarUrl}
            alt={gogAccount.displayName}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-violet-500/40 object-cover shadow-lg shadow-violet-500/20"
          />
        ) : (
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-violet-500/40 bg-violet-500/10 text-violet-400 shadow-lg shadow-violet-500/20">
            <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white truncate">
            {gogAccount?.displayName || "Compte GOG Galaxy"}
          </h2>
          <span className="rounded-full bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 text-[10px] font-bold text-violet-300">
            GOG.com
          </span>
        </div>

        <p className="text-xs text-slate-400 truncate">
          Pseudo GOG :{" "}
          <span className="font-semibold text-slate-200">
            {gogAccount?.username || "Non configuré"}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-950/60 border border-violet-500/30 px-3 py-1 text-xs font-black text-violet-300">
            <Trophy className="h-3.5 w-3.5" />
            {gogAccount?.stats.completedGames || 0} Jeux 100% GOG
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
            {gogAccount?.stats.totalAchievements || 0} Succès
          </div>
          {gogAccount?.lastSyncedAt && (
            <span className="text-[10px] text-slate-500">
              Dernière sync :{" "}
              {new Date(gogAccount.lastSyncedAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => openEditPlatform("gog")}
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Édition manuelle
          </button>
          {gogAccount && (
            <>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleDisconnectPlatform("gog")}
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
