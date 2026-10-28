// components/dashboard/epic-panel/EpicSyncForm.tsx

import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { EpicTokenSection } from "./EpicTokenSection";

interface EpicSyncFormProps {
  epicInput: string;
  setEpicInput: (val: string) => void;
  epicCode: string;
  setEpicCode: (val: string) => void;
  showEpicCode: boolean;
  setShowEpicCode: (val: boolean) => void;
  isSyncingEpic: boolean;
  syncProgressText: string | null;
  onConnectAndSyncEpic: () => void;
  onOpenEpicModal?: () => void;
}

export function EpicSyncForm({
  epicInput,
  setEpicInput,
  epicCode,
  setEpicCode,
  showEpicCode,
  setShowEpicCode,
  isSyncingEpic,
  syncProgressText,
  onConnectAndSyncEpic,
  onOpenEpicModal,
}: EpicSyncFormProps) {
  return (
    <div className="lg:col-span-5 rounded-2xl border border-purple-500/30 bg-slate-950/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Connexion Epic Games (Zero mot de passe)
        </span>
        <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
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
          disabled={isSyncingEpic}
          className="shrink-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isSyncingEpic ? "animate-spin" : ""
            }`}
          />
          <span>{isSyncingEpic ? "Sync..." : "Importer"}</span>
        </button>
      </div>

      <EpicTokenSection
        epicCode={epicCode}
        setEpicCode={setEpicCode}
        showEpicCode={showEpicCode}
        setShowEpicCode={setShowEpicCode}
        onOpenEpicModal={onOpenEpicModal}
      />

      {syncProgressText && isSyncingEpic ? (
        <div className="flex items-center gap-2 text-[11px] text-purple-300 pt-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span className="truncate">{syncProgressText}</span>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">
          Zero mot de passe partagé. Importe automatiquement vos jeux et succès Epic Games.
        </p>
      )}
    </div>
  );
}
