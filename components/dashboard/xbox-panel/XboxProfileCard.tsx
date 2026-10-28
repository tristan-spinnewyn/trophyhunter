// components/dashboard/xbox-panel/XboxProfileCard.tsx

import { Gamepad2, Trophy, Edit3, Unlink } from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

interface XboxProfileCardProps {
  xboxAccount?: UserAccountProfile["accounts"]["xbox"];
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
}

export function XboxProfileCard({
  xboxAccount,
  openEditPlatform,
  handleDisconnectPlatform,
}: XboxProfileCardProps) {
  return (
    <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
          <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>
      </div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-white truncate">
            {xboxAccount?.displayName || "Compte Xbox Live"}
          </h2>
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            Xbox & PC Game Pass
          </span>
        </div>

        <p className="text-xs text-slate-400 truncate">
          Gamertag :{" "}
          <span className="font-semibold text-slate-200">
            {xboxAccount?.username || "Non configuré"}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Trophy className="h-3.5 w-3.5" />
            {xboxAccount?.stats.gamerScore
              ? `${xboxAccount.stats.gamerScore.toLocaleString("fr-FR")} G`
              : "0 G"}
          </div>
          {xboxAccount?.lastSyncedAt && (
            <span className="text-[11px] text-slate-500">
              Dernière sync :{" "}
              {new Date(xboxAccount.lastSyncedAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => openEditPlatform("xbox")}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Édition manuelle
          </button>
          {xboxAccount && (
            <>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleDisconnectPlatform("xbox")}
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
