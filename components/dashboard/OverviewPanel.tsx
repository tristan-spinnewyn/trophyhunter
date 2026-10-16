"use client";

import {
  Gamepad2,
  Trophy,
  Award,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  Edit3,
  Trash2,
  Star,
} from "lucide-react";
import type {
  UserAccountProfile,
  PlatformType,
} from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/storage";

interface OverviewPanelProps {
  globalStats: {
    totalGamesOwned: number;
    trackedGamesCount: number;
    totalCompletedGames: number;
    totalAchievementsUnlocked: number;
    connectedCount: number;
    avgCompletion: number;
  };
  accountProfile: UserAccountProfile;
  platformCounts: Record<string, number>;
  onSelectPlatform: (platform: PlatformType) => void;
  onEditPlatform: (platform: PlatformType) => void;
  onDisconnectPlatform: (platform: PlatformType) => void;
  onSelectGame: (appId: number) => void;
}

export default function OverviewPanel({
  globalStats,
  accountProfile,
  platformCounts,
  onSelectPlatform,
  onEditPlatform,
  onDisconnectPlatform,
  onSelectGame,
}: OverviewPanelProps) {
  const steamAccount = accountProfile.accounts.steam;

  return (
    <>
      {/* Global Hunter Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Jeux Possédés</span>
            <Gamepad2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {globalStats.totalGamesOwned}
          </div>
          <div className="text-[11px] text-slate-400">
            Dont {globalStats.trackedGamesCount} dans la bibliothèque active
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold">Platines / 100%</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {globalStats.totalCompletedGames}
          </div>
          <div className="text-[11px] text-slate-400">
            Jeux terminés à 100% tous comptes
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 to-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-semibold">Succès & Trophées</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {globalStats.totalAchievementsUnlocked}
          </div>
          <div className="text-[11px] text-slate-400">
            Débloqués sur {globalStats.connectedCount || 1} plateforme(s)
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/25 to-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold">Complétion Moyenne</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            {globalStats.avgCompletion}%
          </div>
          <div className="text-[11px] text-slate-400">
            {steamAccount?.stats.badges
              ? `${steamAccount.stats.badges} Badges Steam • ${
                  steamAccount.stats.dlcCount || 0
                } DLC`
              : "Sur vos jeux suivis"}
          </div>
        </div>
      </div>

      {/* Multi-Platform Accounts Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Mes Plateformes de Jeu ({ALL_PLATFORMS.length})
            </h3>
            <p className="text-xs text-slate-400">
              Cliquez sur un espace pour accéder à sa vue dédiée (Steam, Xbox, Epic Games, GOG...).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {ALL_PLATFORMS.map((plat) => {
            const meta = PLATFORM_META[plat];
            const acc = accountProfile.accounts[plat];
            const count = platformCounts[plat] || 0;

            return (
              <div
                key={plat}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
                  acc
                    ? "border-slate-700 bg-slate-950/80 shadow-md"
                    : "border-slate-800/80 bg-slate-950/30 opacity-85 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                    >
                      {meta.shortName}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {count} jeu(x)
                      </span>
                      {acc ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Check className="h-3 w-3" /> Lié
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Non lié
                        </span>
                      )}
                    </div>
                  </div>

                  {acc ? (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="truncate text-sm font-bold text-white">
                          {acc.displayName}
                        </div>
                        {acc.level ? (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                            Niv. {acc.level}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900/90 p-2 text-center">
                        <div>
                          <div className="text-xs font-black text-white">
                            {acc.stats.gamesOwned}
                          </div>
                          <div className="text-[10px] text-slate-400">Jeux</div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-emerald-400">
                            {acc.stats.totalAchievements}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {meta.trophyLabel}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-amber-400">
                            {acc.stats.completedGames}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {meta.completeLabel}
                          </div>
                        </div>
                      </div>

                      {acc.stats.gamerScore ? (
                        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 text-center">
                          {acc.stats.gamerScore.toLocaleString("fr-FR")} G
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Accédez à l&apos;espace {meta.name} pour configurer vos identifiants et voir vos succès.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectPlatform(plat)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-sky-400 transition hover:bg-slate-700 hover:text-white"
                  >
                    <span>Ouvrir l&apos;espace</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => onEditPlatform(plat)}
                    title="Modifier les statistiques ou l'identifiant"
                    className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  {acc && (
                    <button
                      onClick={() => onDisconnectPlatform(plat)}
                      title="Supprimer ce compte"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rare Achievements Showcase */}
      {steamAccount?.rareShowcase && steamAccount.rareShowcase.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400" />
              Vitrine de vos succès les plus rares
            </h3>
            <span className="text-[11px] text-slate-400">
              Cliquez pour ouvrir le jeu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {steamAccount.rareShowcase.map((item, idx) => (
              <button
                key={`${item.appId}_${idx}`}
                onClick={() => onSelectGame(item.appId)}
                className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-slate-950/70 p-2.5 text-left transition hover:border-amber-500/50 hover:bg-slate-900"
              >
                <img
                  src={item.icon}
                  alt={item.achievementName}
                  className="h-11 w-11 rounded-xl object-cover border border-amber-400/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-white">
                    {item.achievementName}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {item.gameName}
                  </div>
                  <div className="mt-0.5 inline-block rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                    Ultra Rare • {item.percent}% des joueurs
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
