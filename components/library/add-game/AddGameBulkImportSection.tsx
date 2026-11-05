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
    <details className="group border-t border-edge pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-paper-dim hover:text-paper">
        <Upload className="h-4 w-4 text-dust" />
        Importer plusieurs jeux Steam d&apos;un coup
        <ChevronDown className="ml-auto h-4 w-4 text-faint transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-dust">
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
          className="w-full rounded-control border border-edge bg-ink p-2.5 text-xs text-paper font-mono outline-none focus:border-lamp"
        />
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={!bulkImportText.trim() || isBulkImporting}
          className="flex items-center gap-1.5 rounded-control bg-lamp px-3.5 py-2 text-sm font-semibold text-ink hover:bg-lamp-bright disabled:opacity-40"
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
