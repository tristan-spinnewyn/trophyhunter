"use client";

import {
  Gamepad2,
  Trophy,
  Edit3,
  Unlink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

interface PlatformGogPanelProps {
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  gogInput: string;
  setGogInput: (val: string) => void;
  gogToken: string;
  setGogToken: (val: string) => void;
  showGogToken: boolean;
  setShowGogToken: (val: boolean) => void;
  isSyncingGOG: boolean;
  onConnectAndSyncGOG: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onBackToAll: () => void;
}

export default function PlatformGogPanel({
  accountProfile,
  platformCounts,
  gogInput,
  setGogInput,
  gogToken,
  setGogToken,
  showGogToken,
  setShowGogToken,
  isSyncingGOG,
  onConnectAndSyncGOG,
  openEditPlatform,
  handleDisconnectPlatform,
  onBackToAll,
}: PlatformGogPanelProps) {
  const gogAccount = accountProfile.accounts.gog;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300">
          Espace Dédié GOG Galaxy & Web API
        </span>
      </div>

      {/* GOG Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-violet-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: GOG Identity & Stats */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-violet-500/40 bg-violet-500/10 text-violet-400 shadow-lg shadow-violet-500/20">
                <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
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

          {/* Right Column: GOG Sync Box */}
          <div className="lg:col-span-5 rounded-2xl border border-violet-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                Synchronisation GOG Web API
              </span>
              <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
                Web API
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={gogInput}
                onChange={(e) => setGogInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConnectAndSyncGOG()}
                placeholder="Pseudo public GOG (ex: GOGUser)"
                className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
              />
              <button
                onClick={() => onConnectAndSyncGOG()}
                disabled={isSyncingGOG || !gogInput.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-violet-500/20"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingGOG ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncingGOG ? "Sync..." : "Importer"}</span>
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowGogToken(!showGogToken)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-violet-300 flex items-center gap-1"
                >
                  <span>{showGogToken ? "▼" : "▶"} Jeton Web GOG (Optionnel)</span>
                  {gogToken ? (
                    <span className="text-[10px] text-violet-400 font-bold">• Actif</span>
                  ) : null}
                </button>
                <a
                  href="https://embed.gog.com/userData.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-violet-400 hover:underline"
                >
                  Profil GOG ↗
                </a>
              </div>
              {(showGogToken || gogToken) && (
                <div className="mt-1.5 space-y-1">
                  <input
                    type="password"
                    value={gogToken}
                    onChange={(e) => setGogToken(e.target.value)}
                    placeholder="Collez votre jeton de session embed.gog.com..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              Scrape et synchronise directement votre profil public GOG sans nécessiter l&apos;application client GOG Galaxy.
            </p>
          </div>
        </div>
      </div>

      {/* GOG Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Jeux GOG</div>
          <div className="text-2xl font-black text-white">{platformCounts.gog || 0}</div>
          <div className="text-[11px] text-slate-400">Bibliothèque GOG</div>
        </div>
        <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-violet-300">Succès Débloqués</div>
          <div className="text-2xl font-black text-violet-400">
            {gogAccount?.stats.totalAchievements || 0}
          </div>
          <div className="text-[11px] text-slate-400">Succès GOG</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
          <div className="text-2xl font-black text-amber-400">
            {gogAccount?.stats.completedGames || 0}
          </div>
          <div className="text-[11px] text-slate-400">Platines GOG</div>
        </div>
      </div>
    </div>
  );
}
