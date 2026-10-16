// components/settings/SteamSettingsSection.tsx

import { User, Check } from "lucide-react";

interface SteamSectionProps {
  steamUser: string;
  setSteamUser: (val: string) => void;
  steamApiKey: string;
  setSteamApiKey: (val: string) => void;
  steamSaved: boolean;
  onSaveSteamUser: () => void;
}

export function SteamSettingsSection({
  steamUser,
  setSteamUser,
  steamApiKey,
  setSteamApiKey,
  steamSaved,
  onSaveSteamUser,
}: SteamSectionProps) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
        <User className="h-4 w-4" />
        Synchronisation automatique sans clé API
      </h3>
      <p className="mt-1 text-xs text-slate-300">
        Si votre profil Steam et vos <strong>« Détails des jeux »</strong> sont en <strong>Public</strong>, l&apos;application peut cocher automatiquement vos succès débloqués !
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={steamUser}
          onChange={(e) => setSteamUser(e.target.value)}
          placeholder="Ex: gabelogannewell ou 76561198..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
        />
        <button
          onClick={onSaveSteamUser}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          {steamSaved ? <Check className="h-3.5 w-3.5" /> : null}
          Enregistrer
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Vous pouvez entrer votre <strong>SteamID64</strong>, votre <strong>pseudo personnalisé</strong> ou l&apos;URL complète de votre profil.
      </p>

      <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300">Clé API Steam (Optionnelle) :</label>
          <a
            href="https://steamcommunity.com/dev/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-sky-400 hover:underline"
          >
            Obtenir ma clé gratuite ↗
          </a>
        </div>
        <input
          type="password"
          value={steamApiKey}
          onChange={(e) => setSteamApiKey(e.target.value)}
          placeholder="Collez votre clé API Steam (32 caractères)..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
        />
        <p className="text-[10px] text-slate-400">
          Recommandé pour importer l&apos;intégralité de vos jeux (&gt;200 jeux). Valve bloque la liste complète des jeux pour les visiteurs non authentifiés.
        </p>
      </div>
    </div>
  );
}
