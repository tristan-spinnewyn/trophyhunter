// components/dashboard/add-game/AddGameBulkImportSection.tsx

import { Upload, Loader2 } from "lucide-react";

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
    <div className="border-t border-slate-800 pt-3 space-y-2">
      <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
        <Upload className="h-3.5 w-3.5" />
        Import massif Steam (AppIDs ou code source de votre page Jeux)
      </label>
      <p className="text-[11px] text-slate-400">
        Vous pouvez coller une liste d&apos;AppIDs Steam (ex:{" "}
        <code>1091500, 1245620, 367520</code>) ou le code source de votre page{" "}
        <code>steamcommunity.com/my/games/?tab=all</code> pour importer tous
        vos jeux d&apos;un coup sans clé API !
      </p>
      <textarea
        value={bulkImportText}
        onChange={(e) => setBulkImportText(e.target.value)}
        rows={3}
        placeholder="Collez ici des AppIDs, URLs Steam ou le code HTML de votre page de jeux..."
        className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
      />
      <button
        onClick={handleBulkImport}
        disabled={!bulkImportText.trim() || isBulkImporting}
        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
      >
        {isBulkImporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Importer dans ma bibliothèque
      </button>
    </div>
  );
}
