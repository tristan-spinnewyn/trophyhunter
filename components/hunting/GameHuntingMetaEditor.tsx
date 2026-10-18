// components/hunting/GameHuntingMetaEditor.tsx
"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { GameHuntingMeta, GameHuntingOverride, HuntingWarningType } from "@/lib/hunting/hunting.types";

interface GameHuntingMetaEditorProps {
  readonly meta: GameHuntingMeta;
  readonly onSave: (override: GameHuntingOverride | undefined) => void;
  readonly onClose: () => void;
}

export function GameHuntingMetaEditor({ meta, onSave, onClose }: GameHuntingMetaEditorProps) {
  const [difficulty, setDifficulty] = useState<number>(meta.difficultyRating);
  const [hours, setHours] = useState<number>(meta.estimatedHours);
  const [runs, setRuns] = useState<number>(meta.minPlaythroughs);
  const [warningType, setWarningType] = useState<HuntingWarningType>(meta.warningType);
  const [warningMessage, setWarningMessage] = useState<string>(meta.warningMessage || "");

  const handleApply = () => {
    onSave({
      difficultyRating: Math.max(1, Math.min(10, Number(difficulty) || 1)),
      estimatedHours: Math.max(1, Math.min(2000, Number(hours) || 1)),
      minPlaythroughs: Math.max(1, Math.min(20, Number(runs) || 1)),
      warningType,
      ...(warningMessage.trim() ? { warningMessage: warningMessage.trim() } : {}),
    });
    onClose();
  };

  return (
    <div className="mt-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3.5 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <label className="space-y-1 text-[11px] text-slate-300">
          <span className="font-semibold">Difficulté (1-10)</span>
          <input type="number" min={1} max={10} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white" />
        </label>
        <label className="space-y-1 text-[11px] text-slate-300">
          <span className="font-semibold">Durée 100% (h)</span>
          <input type="number" min={1} max={2000} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white" />
        </label>
        <label className="space-y-1 text-[11px] text-slate-300">
          <span className="font-semibold">Runs requis</span>
          <input type="number" min={1} max={20} value={runs} onChange={(e) => setRuns(Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white" />
        </label>
        <label className="space-y-1 text-[11px] text-slate-300">
          <span className="font-semibold">Alerte / Statut</span>
          <select value={warningType} onChange={(e) => setWarningType(e.target.value as HuntingWarningType)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white">
            <option value="none">Aucune alerte</option>
            <option value="online-required">En ligne requis</option>
            <option value="bugged">Succès buggé</option>
            <option value="unobtainable">Serveurs fermés / Inobtenable</option>
          </select>
        </label>
      </div>

      {warningType !== "none" && (
        <input
          type="text"
          placeholder="Précision sur l'alerte (ex: Serveurs fermés depuis 2024)..."
          value={warningMessage}
          onChange={(e) => setWarningMessage(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500"
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => { onSave(undefined); onClose(); }} className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700">
          <RotateCcw className="h-3 w-3" /> Auto
        </button>
        <button type="button" onClick={onClose} className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white">
          <X className="h-3 w-3" /> Annuler
        </button>
        <button type="button" onClick={handleApply} className="flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-400">
          <Check className="h-3.5 w-3.5" /> Enregistrer
        </button>
      </div>
    </div>
  );
}
