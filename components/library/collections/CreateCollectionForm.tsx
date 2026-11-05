// components/library/collections/CreateCollectionForm.tsx

import { FolderPlus } from "lucide-react";

interface CreateCollectionFormProps {
  newCollName: string;
  setNewCollName: (val: string) => void;
  newCollDesc: string;
  setNewCollDesc: (val: string) => void;
  handleCreateCollection: () => void;
  onCancel: () => void;
}

export function CreateCollectionForm({
  newCollName,
  setNewCollName,
  newCollDesc,
  setNewCollDesc,
  handleCreateCollection,
  onCancel,
}: CreateCollectionFormProps) {
  return (
    <div className="rounded-sheet border border-paused/40 bg-ink p-4 space-y-3">
      <h4 className="text-sm font-bold text-paper flex items-center gap-2">
        <FolderPlus className="h-4 w-4 text-paused" />
        Créer une nouvelle collection de jeux
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-paper-dim">Nom de la collection</label>
          <input
            type="text"
            value={newCollName}
            onChange={(e) => setNewCollName(e.target.value)}
            placeholder="Ex: Jeux à platiner 2026, Co-op, Backlog..."
            className="mt-1 w-full rounded-control border border-seam bg-plank px-3 py-2 text-xs text-paper outline-none focus:border-paused"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-paper-dim">Description (Optionnel)</label>
          <input
            type="text"
            value={newCollDesc}
            onChange={(e) => setNewCollDesc(e.target.value)}
            placeholder="Objectifs, critères de sélection..."
            className="mt-1 w-full rounded-control border border-seam bg-plank px-3 py-2 text-xs text-paper outline-none focus:border-paused"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-control border border-seam bg-edge px-3 py-1.5 text-xs font-semibold text-paper-dim hover:bg-seam"
        >
          Annuler
        </button>
        <button
          onClick={handleCreateCollection}
          disabled={!newCollName.trim()}
          className="rounded-control bg-paused px-4 py-1.5 text-xs font-bold text-paper hover:bg-paused disabled:opacity-50"
        >
          Créer
        </button>
      </div>
    </div>
  );
}
