// components/settings/BackupSection.tsx

import { Download, Upload, Trash2, Check } from "lucide-react";

interface BackupSectionProps {
  copied: boolean;
  importText: string;
  setImportText: (val: string) => void;
  onExport: () => void;
  onDownload: () => void;
  onImport: () => void;
  onClearAll: () => void;
}

export function BackupSection({
  copied,
  importText,
  setImportText,
  onExport,
  onDownload,
  onImport,
  onClearAll,
}: BackupSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Sauvegarde de vos succès et notes
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
            Copier les données (JSON)
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger le fichier .json
          </button>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] font-medium text-slate-400">Restaurer des données :</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Collez ici votre code JSON exporté..."
            rows={2}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-sky-500 font-mono"
          />
          <button
            onClick={onImport}
            disabled={!importText.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" />
            Importer et appliquer
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer toutes les données locales
        </button>
      </div>
    </div>
  );
}
