// components/dashboard/collections/CreateCollectionForm.tsx

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
    <div className="rounded-2xl border border-indigo-500/40 bg-slate-950 p-4 space-y-3">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <FolderPlus className="h-4 w-4 text-indigo-400" />
        Créer une nouvelle collection de jeux
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-300">Nom de la collection</label>
          <input
            type="text"
            value={newCollName}
            onChange={(e) => setNewCollName(e.target.value)}
            placeholder="Ex: Jeux à platiner 2026, Co-op, Backlog..."
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300">Description (Optionnel)</label>
          <input
            type="text"
            value={newCollDesc}
            onChange={(e) => setNewCollDesc(e.target.value)}
            placeholder="Objectifs, critères de sélection..."
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          Annuler
        </button>
        <button
          onClick={handleCreateCollection}
          disabled={!newCollName.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Créer
        </button>
      </div>
    </div>
  );
}
