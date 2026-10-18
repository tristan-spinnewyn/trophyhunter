// components/dashboard/gog-panel/GogSyncForm.tsx
import { Sparkles, RefreshCw } from "lucide-react";

interface GogSyncFormProps {
  readonly gogInput: string;
  readonly setGogInput: (val: string) => void;
  readonly gogToken: string;
  readonly setGogToken: (val: string) => void;
  readonly showGogToken: boolean;
  readonly setShowGogToken: (val: boolean) => void;
  readonly isSyncingGOG: boolean;
  readonly onConnectAndSyncGOG: () => void;
}

export function GogSyncForm({
  gogInput,
  setGogInput,
  gogToken,
  setGogToken,
  showGogToken,
  setShowGogToken,
  isSyncingGOG,
  onConnectAndSyncGOG,
}: GogSyncFormProps) {
  return (
    <div className="lg:col-span-5 rounded-2xl border border-violet-500/30 bg-slate-950/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Synchronisation GOG Web API
        </span>
        <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
          Web API
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={gogInput}
          onChange={(e) => setGogInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConnectAndSyncGOG()}
          placeholder="Pseudo ou URL GOG (ex: shinkuma13)"
          className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
        />
        <button
          onClick={() => onConnectAndSyncGOG()}
          disabled={isSyncingGOG || !gogInput.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-violet-500/20"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncingGOG ? "animate-spin" : ""}`}
          />
          <span>{isSyncingGOG ? "Sync..." : "Importer"}</span>
        </button>
      </div>

      <div className="pt-1.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowGogToken(!showGogToken)}
            className="text-[11px] font-semibold text-slate-300 hover:text-violet-300 flex items-center gap-1"
          >
            <span>{showGogToken ? "▼" : "▶"} Jeton Web GOG (Optionnel)</span>
            {gogToken ? (
              <span className="text-[10px] text-violet-400 font-bold">• Actif</span>
            ) : null}
          </button>
          <a
            href="https://embed.gog.com/userData.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-violet-400 hover:underline"
          >
            Profil GOG ↗
          </a>
        </div>
        {(showGogToken || gogToken) && (
          <div className="mt-1.5 space-y-1">
            <input
              type="password"
              value={gogToken}
              onChange={(e) => setGogToken(e.target.value)}
              placeholder="Collez votre jeton de session embed.gog.com..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 font-mono"
            />
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400">
        Scrape et synchronise directement votre profil public GOG sans nécessiter l&apos;application client GOG Galaxy.
      </p>
    </div>
  );
}
