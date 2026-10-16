"use client";

import {
  User,
  Sparkles,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { PlatformAccount } from "@/lib/types";

interface PlatformSteamPanelProps {
  steamAccount?: PlatformAccount;
  displayName: string;
  platformCounts: Record<string, number>;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (val: boolean) => void;
  isSyncingSteam: boolean;
  syncProgressText: string | null;
  onConnectAndSyncSteam: () => void;
  onBackToAll: () => void;
}

export default function PlatformSteamPanel({
  steamAccount,
  displayName,
  platformCounts,
  steamInput,
  setSteamInput,
  steamApiKey,
  setSteamApiKey,
  showApiKeyInput,
  setShowApiKeyInput,
  isSyncingSteam,
  syncProgressText,
  onConnectAndSyncSteam,
  onBackToAll,
}: PlatformSteamPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300">
          Espace Dédié Steam
        </span>
      </div>

      {/* Steam Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
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
              {steamAccount?.level ? (
                <div
                  title="Niveau Steam"
                  className="absolute -bottom-1.5 -right-1.5 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-br from-amber-400 to-amber-600 px-1.5 text-[11px] font-black text-slate-950 shadow"
                >
                  {steamAccount.level}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {steamAccount?.displayName || displayName}
                </h2>
                {steamAccount?.onlineState && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      steamAccount.onlineState === "online" ||
                      steamAccount.onlineState === "in-game"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        steamAccount.onlineState === "online" ||
                        steamAccount.onlineState === "in-game"
                          ? "bg-emerald-400"
                          : "bg-slate-500"
                      }`}
                    />
                    {steamAccount.onlineState === "online"
                      ? "En ligne"
                      : steamAccount.onlineState === "in-game"
                      ? "En jeu"
                      : "Hors ligne"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {steamAccount ? (
                  <>
                    <span>SteamID : {steamAccount.username}</span>
                    {steamAccount.location && (
                      <>
                        <span>•</span>
                        <span>{steamAccount.location}</span>
                      </>
                    )}
                    {steamAccount.memberSince && (
                      <>
                        <span>•</span>
                        <span>Membre depuis {steamAccount.memberSince}</span>
                      </>
                    )}
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

          {/* Steam Sync Input Form */}
          <div className="w-full md:w-auto md:min-w-[340px] rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Synchronisation Steam
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">
                {steamApiKey ? "Clé API Active ✓" : "Sans Clé ou Avec Clé"}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={steamInput}
                onChange={(e) => setSteamInput(e.target.value)}
                placeholder="SteamID64, pseudo ou URL Steam..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                onClick={onConnectAndSyncSteam}
                disabled={isSyncingSteam || !steamInput.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingSteam ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncingSteam ? "Sync..." : "Importer"}</span>
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="text-[11px] font-semibold text-slate-300 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>{showApiKeyInput ? "▼" : "▶"} Clé API Steam (Optionnelle)</span>
                  {steamApiKey ? (
                    <span className="text-[10px] text-emerald-400 font-bold">• Active</span>
                  ) : null}
                </button>
                <a
                  href="https://steamcommunity.com/dev/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Obtenir ma clé ↗
                </a>
              </div>
              {(showApiKeyInput || steamApiKey) && (
                <div className="mt-1.5 space-y-1">
                  <input
                    type="password"
                    value={steamApiKey}
                    onChange={(e) => setSteamApiKey(e.target.value)}
                    placeholder="Collez votre clé API Steam..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              )}
            </div>

            {syncProgressText ? (
              <div className="flex items-center gap-2 text-[11px] text-sky-300 pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span className="truncate">{syncProgressText}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">
                Importe automatiquement vos jeux et succès Steam sans mot de passe.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Steam Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400">Jeux Steam</div>
          <div className="text-2xl font-black text-white">{platformCounts.steam || 0}</div>
          <div className="text-[11px] text-slate-400">Dans votre bibliothèque</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
          <div className="text-2xl font-black text-emerald-400">{steamAccount?.stats.totalAchievements || 0}</div>
          <div className="text-[11px] text-slate-400">Sur vos jeux Steam</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
          <div className="text-2xl font-black text-amber-400">{steamAccount?.stats.completedGames || 0}</div>
          <div className="text-[11px] text-slate-400">Platines Steam</div>
        </div>
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1">
          <div className="text-xs font-semibold text-sky-300">Badges & DLC</div>
          <div className="text-2xl font-black text-sky-400">{steamAccount?.stats.badges || 0}</div>
          <div className="text-[11px] text-slate-400">{steamAccount?.stats.dlcCount || 0} DLC possédés</div>
        </div>
      </div>
    </div>
  );
}
