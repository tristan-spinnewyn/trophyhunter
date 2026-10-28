// components/dashboard/xbox-panel/XboxSyncForm.tsx

import { Sparkles, RefreshCw } from "lucide-react";

interface XboxSyncFormProps {
  xboxInput: string;
  setXboxInput: (val: string) => void;
  xboxApiKey: string;
  setXboxApiKey: (val: string) => void;
  showXboxApiKey: boolean;
  setShowXboxApiKey: (val: boolean) => void;
  isSyncingXbox: boolean;
  onConnectAndSyncXbox: () => void;
}

export function XboxSyncForm({
  xboxInput,
  setXboxInput,
  xboxApiKey,
  setXboxApiKey,
  showXboxApiKey,
  setShowXboxApiKey,
  isSyncingXbox,
  onConnectAndSyncXbox,
}: XboxSyncFormProps) {
  return (
    <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Synchronisation Xbox API
        </span>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
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
          onClick={() => onConnectAndSyncXbox()}
          disabled={isSyncingXbox || !xboxInput.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncingXbox ? "animate-spin" : ""}`}
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
              <span className="text-[11px] text-emerald-400 font-bold">• Active</span>
            ) : null}
          </button>
          <a
            href="https://xbl.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-400 hover:underline"
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

      <p className="text-[11px] text-slate-400">
        Importe vos jeux Xbox & PC Game Pass ainsi que vos succès et Gamerscore sans mot de passe.
      </p>
    </div>
  );
}
