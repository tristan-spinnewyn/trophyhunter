// components/dashboard/epic-panel/EpicTokenSection.tsx

import { KeyRound } from "lucide-react";
import { EPIC_AUTH_CODE_URL, parseEpicAuthInput } from "@/lib/epic/auth-input";

interface EpicTokenSectionProps {
  epicCode: string;
  setEpicCode: (val: string) => void;
  showEpicCode: boolean;
  setShowEpicCode: (val: boolean) => void;
  onOpenEpicModal?: () => void;
}

export function EpicTokenSection({
  epicCode,
  setEpicCode,
  showEpicCode,
  setShowEpicCode,
  onOpenEpicModal,
}: EpicTokenSectionProps) {
  return (
    <div className="pt-1.5 border-t border-slate-800/80">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowEpicCode(!showEpicCode)}
          className="text-[11px] font-semibold text-slate-300 hover:text-purple-300 flex items-center gap-1"
        >
          <span>{showEpicCode ? "▼" : "▶"} Token / Code Epic (authorizationToken)</span>
          {epicCode ? (
            <span className="text-[10px] text-purple-400 font-bold">• Token saisi</span>
          ) : null}
        </button>
        <a
          href={EPIC_AUTH_CODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
        >
          Obtenir le token ↗
        </a>
      </div>

      {(showEpicCode || epicCode) && (
        <div className="mt-2 space-y-1.5 text-[11px] text-slate-400 bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5">
          <p className="text-[10px] text-slate-300">
            1. Cliquez sur <a href={EPIC_AUTH_CODE_URL} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold">ce lien Epic officiel</a> (authentification sécurisée sur epicgames.com).
          </p>
          <p className="text-[10px] text-slate-300">
            2. Copiez la valeur de <code>authorizationCode</code> (ou tout le JSON) et collez-la ci-dessous :
          </p>
          <input
            type="password"
            value={epicCode}
            onChange={(e) => setEpicCode(parseEpicAuthInput(e.target.value))}
            placeholder="Collez votre authorizationToken ou code d'échange OAuth..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
          />
        </div>
      )}

      {onOpenEpicModal && (
        <button
          type="button"
          onClick={onOpenEpicModal}
          className="mt-2.5 w-full rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition flex items-center justify-center gap-2"
        >
          <KeyRound className="h-3.5 w-3.5 text-purple-400" />
          <span>Saisir un code d&apos;autorisation (Modal guidée)</span>
        </button>
      )}
    </div>
  );
}
