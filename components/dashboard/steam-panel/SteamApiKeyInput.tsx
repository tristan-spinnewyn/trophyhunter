// components/dashboard/steam-panel/SteamApiKeyInput.tsx

interface SteamApiKeyInputProps {
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (val: boolean) => void;
}

export function SteamApiKeyInput({
  steamApiKey,
  setSteamApiKey,
  showApiKeyInput,
  setShowApiKeyInput,
}: SteamApiKeyInputProps) {
  return (
    <div className="pt-1.5 border-t border-slate-800/80">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="text-[11px] font-semibold text-slate-300 hover:text-sky-300 flex items-center gap-1"
        >
          <span>{showApiKeyInput ? "▼" : "▶"} Clé API Steam (Optionnelle)</span>
          {steamApiKey && <span className="text-[10px] text-emerald-400 font-bold">• Active</span>}
        </button>
        <a
          href="https://steamcommunity.com/dev/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-sky-400 hover:underline"
        >
          Obtenir ma clé ↗
        </a>
      </div>
      {(showApiKeyInput || steamApiKey) && (
        <div className="mt-1.5 space-y-1">
          <input
            type="password"
            value={steamApiKey}
            onChange={(e) => setSteamApiKey(e.target.value)}
            placeholder="Collez votre clé API Steam..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
          />
        </div>
      )}
    </div>
  );
}
