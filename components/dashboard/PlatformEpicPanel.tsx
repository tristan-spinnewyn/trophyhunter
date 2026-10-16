"use client";

import {
  Trophy,
  Edit3,
  Unlink,
  Sparkles,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
import type { UserAccountProfile, PlatformType } from "@/lib/types";

interface PlatformEpicPanelProps {
  accountProfile: UserAccountProfile;
  epicCounts: { total: number; withAch: number; noAch: number };
  epicInput: string;
  setEpicInput: (val: string) => void;
  epicCode: string;
  setEpicCode: (val: string) => void;
  showEpicCode: boolean;
  setShowEpicCode: (val: boolean) => void;
  isSyncingEpic: boolean;
  syncProgressText: string | null;
  libAchievementFilter: "all" | "with-achievements" | "no-achievements";
  setLibAchievementFilter: (val: "all" | "with-achievements" | "no-achievements") => void;
  onConnectAndSyncEpic: () => void;
  onScanEpicAchievements: () => void;
  onCleanEpicGames: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onBackToAll: () => void;
}

export default function PlatformEpicPanel({
  accountProfile,
  epicCounts,
  epicInput,
  setEpicInput,
  epicCode,
  setEpicCode,
  showEpicCode,
  setShowEpicCode,
  isSyncingEpic,
  syncProgressText,
  libAchievementFilter,
  setLibAchievementFilter,
  onConnectAndSyncEpic,
  onScanEpicAchievements,
  onCleanEpicGames,
  openEditPlatform,
  handleDisconnectPlatform,
  onBackToAll,
}: PlatformEpicPanelProps) {
  const epicAccount = accountProfile.accounts.epic;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300">
          Espace Dédié Epic Games Store
        </span>
      </div>

      {/* Epic Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Epic Identity & Stats */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/20">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {epicAccount?.displayName || "Compte Epic Games"}
                </h2>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
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
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3 py-1 text-xs font-black text-purple-300">
                  <Trophy className="h-3.5 w-3.5" />
                  {epicAccount?.stats.completedGames || 0} Platine(s)
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
                  {epicAccount?.stats.totalAchievements || 0} Succès XP
                </div>
                {epicAccount?.lastSyncedAt && (
                  <span className="text-[10px] text-slate-500">
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

          {/* Right Column: Epic Games Sync Box */}
          <div className="lg:col-span-5 rounded-2xl border border-purple-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Connexion Epic Games (Zero mot de passe)
              </span>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                OAuth Epic
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={epicInput}
                onChange={(e) => setEpicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConnectAndSyncEpic()}
                placeholder="Pseudo Epic Games (ex: Alex)"
                className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
              />
              <button
                onClick={() => onConnectAndSyncEpic()}
                disabled={isSyncingEpic || (!epicInput.trim() && !epicCode.trim())}
                className="shrink-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-purple-500/20"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingEpic ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncingEpic ? "Sync..." : "Importer"}</span>
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEpicCode(!showEpicCode)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>{showEpicCode ? "▼" : "▶"} Token / Code Epic (authorizationToken)</span>
                  {epicCode ? (
                    <span className="text-[10px] text-purple-400 font-bold">• Token saisi</span>
                  ) : null}
                </button>
                <a
                  href="https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                >
                  Obtenir le token ↗
                </a>
              </div>
              {(showEpicCode || epicCode) && (
                <div className="mt-2 space-y-1.5 text-[11px] text-slate-400 bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-300">
                    1. Cliquez sur <a href="https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold">ce lien Epic officiel</a> (authentification sécurisée sur epicgames.com).
                  </p>
                  <p className="text-[10px] text-slate-300">
                    2. Copiez la valeur de <code>authorizationCode</code> (ou tout le JSON) et collez-la ci-dessous :
                  </p>
                  <input
                    type="password"
                    value={epicCode}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (val.startsWith("{")) {
                        try {
                          const parsed = JSON.parse(val);
                          val =
                            parsed.authorizationCode ||
                            parsed.authorizationToken ||
                            parsed.code ||
                            parsed.token ||
                            val;
                        } catch {}
                      }
                      setEpicCode(val);
                    }}
                    placeholder="Collez votre authorizationToken ou code d'échange OAuth..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              )}
            </div>

            {syncProgressText && isSyncingEpic ? (
              <div className="flex items-center gap-2 text-[11px] text-purple-300 pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span className="truncate">{syncProgressText}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">
                Zero mot de passe partagé. Importe automatiquement vos jeux et succès Epic Games.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Epic Achievement System Info & Dedicated Quick Filters */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-purple-200">
              Tri & Filtrage des succès Epic Games
            </p>
            <p className="text-[11px] text-slate-300">
              Sur l&apos;Epic Games Store, certains jeux intègrent les <strong>Succès Epic Games</strong> (avec points XP et Trophée Platine), tandis que d&apos;autres n&apos;en ont pas. Utilisez ces filtres rapides pour isoler les jeux avec succès :
            </p>
          </div>
        </div>

        {/* Quick Pills for Epic Achievements */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-500/20">
          <button
            onClick={() => setLibAchievementFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              libAchievementFilter === "all"
                ? "bg-purple-500 text-slate-950 shadow-md"
                : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
            }`}
          >
            Tous les jeux Epic ({epicCounts.total})
          </button>
          <button
            onClick={() => setLibAchievementFilter("with-achievements")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              libAchievementFilter === "with-achievements"
                ? "bg-purple-500 text-slate-950 shadow-md"
                : "border border-purple-500/40 bg-purple-950/60 text-purple-300 hover:bg-purple-900/60"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Avec succès Epic XP uniquement ({epicCounts.withAch})
          </button>
          <button
            onClick={() => setLibAchievementFilter("no-achievements")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              libAchievementFilter === "no-achievements"
                ? "bg-slate-700 text-white shadow-md"
                : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
            }`}
          >
            Sans succès ({epicCounts.noAch})
          </button>
          {epicCounts.total > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {epicCounts.noAch > 0 && (
                <button
                  type="button"
                  disabled={isSyncingEpic}
                  onClick={onScanEpicAchievements}
                  className="rounded-xl border border-purple-500/40 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-500/30 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isSyncingEpic ? "animate-spin" : ""
                    }`}
                  />
                  Scanner les succès ({epicCounts.noAch})
                </button>
              )}
              <button
                type="button"
                onClick={onCleanEpicGames}
                className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 hover:text-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Nettoyer les jeux Epic ({epicCounts.total})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Epic Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Total Jeux Epic</div>
          <div className="text-2xl font-black text-white">{epicCounts.total}</div>
          <div className="text-[11px] text-slate-400">Bibliothèque Epic</div>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-purple-300">Avec Succès XP</div>
          <div className="text-2xl font-black text-purple-400">{epicCounts.withAch}</div>
          <div className="text-[11px] text-slate-400">Chasse aux trophées active</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500">Sans Succès</div>
          <div className="text-2xl font-black text-slate-400">{epicCounts.noAch}</div>
          <div className="text-[11px] text-slate-500">Pas de succès répertoriés</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Platines Epic</div>
          <div className="text-2xl font-black text-amber-400">
            {epicAccount?.stats.completedGames || 0}
          </div>
          <div className="text-[11px] text-slate-400">Jeux complétés à 100%</div>
        </div>
      </div>
    </div>
  );
}
