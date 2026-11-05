// components/hunting/GameHuntingMetaBar.tsx
"use client";

import { useState } from "react";
import { Clock, Flame, Repeat, AlertTriangle, Globe, ShieldAlert, Bug, SlidersHorizontal } from "lucide-react";
import type { GameHuntingMeta, GameHuntingOverride } from "@/lib/hunting/hunting.types";
import { GameHuntingMetaEditor } from "./GameHuntingMetaEditor";

interface GameHuntingMetaBarProps {
  readonly meta: GameHuntingMeta;
  readonly onSaveOverride?: (override: GameHuntingOverride | undefined) => void;
}

export function GameHuntingMetaBar({ meta, onSaveOverride }: GameHuntingMetaBarProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="mt-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium ${meta.difficultyBadgeClass}`}>
            <Flame className="h-3.5 w-3.5" />
            Difficulté : {meta.difficultyRating}/10 • {meta.difficultyLabel}
          </span>

          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-ink/40 px-2 py-1 font-medium text-paper-dim">
            <Clock className="h-3.5 w-3.5 text-lamp-bright" />
            ~{meta.estimatedHours}h
          </span>

          <span className="flex items-center gap-1.5 rounded-md border border-edge bg-ink/40 px-2 py-1 font-medium text-paper-dim">
            <Repeat className="h-3.5 w-3.5 text-paused" />
            {meta.minPlaythroughs} {meta.minPlaythroughs > 1 ? "runs min." : "run min."}
          </span>

          {meta.missableCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-md border border-lamp/30 bg-lamp/10 px-2 py-1 font-medium text-lamp-bright">
              <AlertTriangle className="h-3.5 w-3.5" />
              {meta.missableCount} {meta.missableCount > 1 ? "manquables" : "manquable"}
            </span>
          )}

          {meta.onlineCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-md border border-paused/30 bg-paused/10 px-2 py-1 font-medium text-paused">
              <Globe className="h-3.5 w-3.5" />
              {meta.onlineCount} en ligne
            </span>
          )}
        </div>

        {onSaveOverride && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-dust transition hover:bg-edge hover:text-paper"
          >
            <SlidersHorizontal className="h-3 w-3" />
            {meta.isCustomOverride ? "Infos personnalisées" : "Ajuster"}
          </button>
        )}
      </div>

      {meta.warningType === "unobtainable" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-danger/50 bg-danger/40 px-3.5 py-2 text-xs font-semibold text-danger">
          <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
          <span>⛔ Alerte Platine Inobtenable / Serveurs fermés : {meta.warningMessage}</span>
        </div>
      )}

      {meta.warningType === "bugged" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-lamp/50 bg-lamp/40 px-3.5 py-2 text-xs font-semibold text-lamp-bright">
          <Bug className="h-4 w-4 shrink-0 text-lamp-bright" />
          <span>🐛 Alerte Succès Buggés : {meta.warningMessage}</span>
        </div>
      )}

      {meta.warningType === "online-required" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-paused/40 bg-paused/30 px-3.5 py-2 text-xs font-medium text-paused">
          <Globe className="h-4 w-4 shrink-0 text-paused" />
          <span>🌐 Attention Serveurs En Ligne : {meta.warningMessage}</span>
        </div>
      )}

      {isEditing && onSaveOverride && (
        <GameHuntingMetaEditor
          meta={meta}
          onSave={onSaveOverride}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
