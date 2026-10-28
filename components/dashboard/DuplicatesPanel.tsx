// components/dashboard/DuplicatesPanel.tsx

"use client";

import { Copy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { DuplicateGroupCard } from "./duplicates/DuplicateGroupCard";

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

      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/40 p-5 sm:p-6 space-y-2">
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
            <DuplicateGroupCard
              key={gIdx}
              group={group}
              onSelectGame={onSelectGame}
            />
          ))}
        </div>
      )}
    </div>
  );
}
