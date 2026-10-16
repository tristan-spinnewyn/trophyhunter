// components/dashboard/steam-panel/SteamProfileCard.tsx

import { User, ExternalLink } from "lucide-react";
import type { PlatformAccount } from "@/lib/types";

interface ProfileCardProps {
  steamAccount?: PlatformAccount;
  displayName: string;
}

export function SteamProfileCard({ steamAccount, displayName }: ProfileCardProps) {
  const isOnline = steamAccount?.onlineState === "online" || steamAccount?.onlineState === "in-game";

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        {steamAccount?.avatarUrl ? (
          <img
            src={steamAccount.avatarUrl}
            alt={steamAccount.displayName}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-sky-500/50 shadow-lg shadow-sky-500/20"
          />
        ) : (
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-sky-400">
            <User className="h-8 w-8" />
          </div>
        )}
        {steamAccount?.level && (
          <div
            title="Niveau Steam"
            className="absolute -bottom-1.5 -right-1.5 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-br from-amber-400 to-amber-600 px-1.5 text-[11px] font-black text-slate-950 shadow"
          >
            {steamAccount.level}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {steamAccount?.displayName || displayName}
          </h2>
          {steamAccount?.onlineState && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isOnline ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-500"}`} />
              {steamAccount.onlineState === "online" ? "En ligne" : steamAccount.onlineState === "in-game" ? "En jeu" : "Hors ligne"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {steamAccount ? (
            <>
              <span>SteamID : {steamAccount.username}</span>
              {steamAccount.location && <span>• {steamAccount.location}</span>}
              {steamAccount.memberSince && <span>• Membre depuis {steamAccount.memberSince}</span>}
            </>
          ) : (
            <span>Renseignez votre SteamID pour synchroniser automatiquement vos succès.</span>
          )}
        </div>

        {steamAccount?.profileUrl && (
          <div className="pt-1">
            <a
              href={steamAccount.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
            >
              Voir le profil Steam officiel
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
