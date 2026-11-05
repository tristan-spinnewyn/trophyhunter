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
        <h3 className="text-xs font-bold uppercase tracking-wider text-dust">
          Sauvegarde de vos succès et notes
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-control border border-seam bg-edge px-3 py-2 text-xs font-medium text-paper transition hover:bg-seam hover:text-paper"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-done" /> : <Download className="h-3.5 w-3.5" />}
            Copier les données (JSON)
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-control border border-seam bg-edge px-3 py-2 text-xs font-medium text-paper transition hover:bg-seam hover:text-paper"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger le fichier .json
          </button>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] font-medium text-dust">Restaurer des données :</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Collez ici votre code JSON exporté..."
            rows={2}
            className="w-full rounded-control border border-edge bg-ink p-2 text-xs text-paper-dim placeholder-seam outline-none focus:border-lamp font-mono"
          />
          <button
            onClick={onImport}
            disabled={!importText.trim()}
            className="flex items-center gap-1.5 rounded-control bg-lamp px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-lamp disabled:opacity-40"
          >
            <Upload className="h-3.5 w-3.5" />
            Importer et appliquer
          </button>
        </div>
      </div>

      <div className="border-t border-edge pt-3">
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer toutes les données locales
        </button>
      </div>
    </div>
  );
}
