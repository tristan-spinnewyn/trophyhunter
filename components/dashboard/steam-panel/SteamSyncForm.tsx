// components/dashboard/steam-panel/SteamSyncForm.tsx

import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { SteamApiKeyInput } from "./SteamApiKeyInput";

interface SyncFormProps {
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (val: boolean) => void;
  isSyncingSteam: boolean;
  syncProgressText: string | null;
  onConnectAndSyncSteam: () => void;
}

export function SteamSyncForm({
  steamInput,
  setSteamInput,
  steamApiKey,
  setSteamApiKey,
  showApiKeyInput,
  setShowApiKeyInput,
  isSyncingSteam,
  syncProgressText,
  onConnectAndSyncSteam,
}: SyncFormProps) {
  return (
    <div className="w-full md:w-auto md:min-w-[340px] rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Synchronisation Steam
        </label>
        <span className="text-[11px] text-emerald-400 font-medium">
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
          className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSteam ? "animate-spin" : ""}`} />
          <span>{isSyncingSteam ? "Sync..." : "Importer"}</span>
        </button>
      </div>

      <SteamApiKeyInput
        steamApiKey={steamApiKey}
        setSteamApiKey={setSteamApiKey}
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
      />

      {syncProgressText ? (
        <div className="flex items-center gap-2 text-[11px] text-sky-300 pt-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span className="truncate">{syncProgressText}</span>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">
          Importe automatiquement vos jeux et succès Steam sans mot de passe.
        </p>
      )}
    </div>
  );
}
