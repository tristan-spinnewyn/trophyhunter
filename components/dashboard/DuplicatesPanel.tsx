"use client";

import { Copy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";

interface DuplicatesPanelProps {
  duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  onSelectGame: (appId: number) => void;
  onBackToAll: () => void;
}

export default function DuplicatesPanel({
  duplicateGroups,
  onSelectGame,
  onBackToAll,
}: DuplicatesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 flex items-center gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          {duplicateGroups.length} doublon(s) détecté(s)
        </span>
      </div>

      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/40 p-5 sm:p-6 shadow-2xl space-y-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Copy className="h-5 w-5 text-purple-400" />
          Détection des Doublons Multiplateformes
        </h3>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Trophy Hunter identifie automatiquement les jeux identiques que vous possédez sur plusieurs stores différents (Steam, Xbox Live / Game Pass, Epic Games, GOG Galaxy).
          Comparez votre état de complétion ci-dessous et privilégiez la plateforme sur laquelle vous souhaitez chasser vos succès !
        </p>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-white">Aucun doublon trouvé</p>
          <p className="text-xs text-slate-400">
            Tous vos jeux actuels sont uniques à une seule plateforme.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {duplicateGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <h4 className="text-sm font-black text-white truncate">
                  {group.title}
                </h4>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300 shrink-0">
                  {group.games.length} plateformes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.games.map((g) => {
                  const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;
                  const pct =
                    g.totalAchievements > 0
                      ? Math.min(
                          100,
                          Math.round((g.unlockedCount / g.totalAchievements) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={`${g.platform}_${g.appId}`}
                      onClick={() => onSelectGame(g.appId)}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3 hover:border-purple-500/50 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${pMeta.badgeClass}`}
                          >
                            {pMeta.shortName}
                          </span>
                          {g.totalAchievements > 0 ? (
                            <span className="text-[10px] font-black text-emerald-400">
                              {pct}% ({g.unlockedCount}/{g.totalAchievements})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              Sans succès
                            </span>
                          )}
                        </div>

                        <img
                          src={g.headerImg}
                          alt={g.name}
                          className="h-16 w-full object-cover rounded-lg bg-slate-950"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{g.playtimeHours ? `${g.playtimeHours} h` : "0 h"}</span>
                        <span className="text-sky-400 hover:underline font-semibold">
                          Ouvrir →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
