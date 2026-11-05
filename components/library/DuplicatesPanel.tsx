// components/library/DuplicatesPanel.tsx

"use client";

import { Copy } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import { DuplicateGroupCard } from "./duplicates/DuplicateGroupCard";

interface DuplicatesPanelProps {
  duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  onSelectGame: (appId: number) => void;
}

export default function DuplicatesPanel({
  duplicateGroups,
  onSelectGame,
}: DuplicatesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-control border border-platinum/40 bg-platinum/10 text-platinum flex items-center gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          {duplicateGroups.length} doublon(s) détecté(s)
        </span>
      </div>

      <div className="rounded-sheet border border-edge bg-plank/60 p-5 sm:p-6 space-y-2">
        <h3 className="text-lg font-bold text-paper flex items-center gap-2">
          <Copy className="h-5 w-5 text-platinum" />
          Détection des Doublons Multiplateformes
        </h3>
        <p className="text-xs text-paper-dim max-w-2xl leading-relaxed">
          Trophy Hunter identifie automatiquement les jeux identiques que vous possédez sur plusieurs stores différents (Steam, Xbox Live / Game Pass, Epic Games, GOG Galaxy).
          Comparez votre état de complétion ci-dessous et privilégiez la plateforme sur laquelle vous souhaitez chasser vos succès !
        </p>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="rounded-sheet border border-edge bg-ink/60 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-paper">Aucun doublon trouvé</p>
          <p className="text-xs text-dust">
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
