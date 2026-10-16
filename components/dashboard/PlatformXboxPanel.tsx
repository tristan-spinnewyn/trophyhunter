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

interface PlatformXboxPanelProps {
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  xboxInput: string;
  setXboxInput: (val: string) => void;
  xboxApiKey: string;
  setXboxApiKey: (val: string) => void;
  showXboxApiKey: boolean;
  setShowXboxApiKey: (val: boolean) => void;
  isSyncingXbox: boolean;
  onConnectAndSyncXbox: () => void;
  openEditPlatform: (plat: PlatformType) => void;
  handleDisconnectPlatform: (plat: PlatformType) => void;
  onBackToAll: () => void;
}

export default function PlatformXboxPanel({
  accountProfile,
  platformCounts,
  xboxInput,
  setXboxInput,
  xboxApiKey,
  setXboxApiKey,
  showXboxApiKey,
  setShowXboxApiKey,
  isSyncingXbox,
  onConnectAndSyncXbox,
  openEditPlatform,
  handleDisconnectPlatform,
  onBackToAll,
}: PlatformXboxPanelProps) {
  const xboxAccount = accountProfile.accounts.xbox;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
          Espace Dédié Xbox Live & PC Game Pass
        </span>
      </div>

      {/* Xbox Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Xbox Identity & Stats */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {xboxAccount?.displayName || "Compte Xbox Live"}
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
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
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-300">
                  <Trophy className="h-3.5 w-3.5" />
                  {xboxAccount?.stats.gamerScore
                    ? `${xboxAccount.stats.gamerScore.toLocaleString("fr-FR")} G`
                    : "0 G"}
                </div>
                {xboxAccount?.lastSyncedAt && (
                  <span className="text-[10px] text-slate-500">
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

          {/* Right Column: Xbox Live Sync Box */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Synchronisation Xbox API
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                OpenXBL
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={xboxInput}
                onChange={(e) => setXboxInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConnectAndSyncXbox()}
                placeholder="Gamertag (ex: Major Nelson)"
                className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                onClick={onConnectAndSyncXbox}
                disabled={isSyncingXbox || !xboxInput.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingXbox ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncingXbox ? "Sync..." : "Importer"}</span>
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowXboxApiKey(!showXboxApiKey)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>{showXboxApiKey ? "▼" : "▶"} Clé OpenXBL (Optionnelle)</span>
                  {xboxApiKey ? (
                    <span className="text-[10px] text-emerald-400 font-bold">• Active</span>
                  ) : null}
                </button>
                <a
                  href="https://xbl.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Obtenir sur xbl.io ↗
                </a>
              </div>
              {(showXboxApiKey || xboxApiKey) && (
                <div className="mt-1.5 space-y-1">
                  <input
                    type="password"
                    value={xboxApiKey}
                    onChange={(e) => setXboxApiKey(e.target.value)}
                    placeholder="Collez votre clé API OpenXBL (xbl.io)..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              Importe vos jeux Xbox & PC Game Pass ainsi que vos succès et Gamerscore sans mot de passe.
            </p>
          </div>
        </div>
      </div>

      {/* Xbox Information Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-200">
            Synchronisation Xbox Live & PC Game Pass par API
          </p>
          <p className="text-[11px] text-slate-400">
            Vous pouvez ajouter vos jeux Xbox (console et PC) ci-dessous. En reliant votre Gamertag via OpenXBL, l&apos;intégralité de vos succès, raretés et Gamerscore sont automatiquement suivis sans entrer de mot de passe.
          </p>
        </div>
      </div>

      {/* Xbox Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Jeux Xbox Suivis</div>
          <div className="text-2xl font-black text-white">{platformCounts.xbox || 0}</div>
          <div className="text-[11px] text-slate-400">Console & PC Game Pass</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
          <div className="text-2xl font-black text-emerald-400">
            {xboxAccount?.stats.totalAchievements || 0}
          </div>
          <div className="text-[11px] text-slate-400">Succès Xbox</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Jeux 1000G / 100%</div>
          <div className="text-2xl font-black text-amber-400">
            {xboxAccount?.stats.completedGames || 0}
          </div>
          <div className="text-[11px] text-slate-400">Jeux complétés</div>
        </div>
      </div>
    </div>
  );
}
