// components/library/add-game/AddGameBulkImportSection.tsx

import { Upload, Loader2, ChevronDown } from "lucide-react";

interface AddGameBulkImportSectionProps {
  bulkImportText: string;
  setBulkImportText: (val: string) => void;
  handleBulkImport: () => void;
  isBulkImporting: boolean;
}

export function AddGameBulkImportSection({
  bulkImportText,
  setBulkImportText,
  handleBulkImport,
  isBulkImporting,
}: AddGameBulkImportSectionProps) {
  return (
    <details className="group border-t border-slate-800 pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
        <Upload className="h-4 w-4 text-slate-400" />
        Importer plusieurs jeux Steam d&apos;un coup
        <ChevronDown className="ml-auto h-4 w-4 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-slate-400">
          Vous pouvez coller une liste d&apos;AppIDs Steam (ex:{" "}
          <code>1091500, 1245620, 367520</code>) ou le code source de votre page{" "}
          <code>steamcommunity.com/my/games/?tab=all</code> pour importer tous
          vos jeux d&apos;un coup sans clé API !
        </p>
        <textarea
          value={bulkImportText}
          onChange={(e) => setBulkImportText(e.target.value)}
          rows={3}
          aria-label="AppIDs, URLs Steam ou code HTML de ta page de jeux"
          placeholder="AppIDs, URLs Steam ou code HTML de ta page de jeux…"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={!bulkImportText.trim() || isBulkImporting}
          className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40"
        >
          {isBulkImporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Importer dans ma bibliothèque
        </button>
      </div>
    </details>
  );
}
