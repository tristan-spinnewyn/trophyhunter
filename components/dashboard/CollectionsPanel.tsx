"use client";

import { FolderPlus, Folder, Trash2 } from "lucide-react";
import type { LocalCollection } from "@/lib/storage";

interface CollectionsPanelProps {
  collections: LocalCollection[];
  selectedCollId: string | null;
  setSelectedCollId: (id: string | null) => void;
  isCreatingColl: boolean;
  setIsCreatingColl: (val: boolean) => void;
  newCollName: string;
  setNewCollName: (val: string) => void;
  newCollDesc: string;
  setNewCollDesc: (val: string) => void;
  handleCreateCollection: () => void;
  handleDeleteCollection: (id: string) => void;
  onBackToAll: () => void;
}

export default function CollectionsPanel({
  collections,
  selectedCollId,
  setSelectedCollId,
  isCreatingColl,
  setIsCreatingColl,
  newCollName,
  setNewCollName,
  newCollDesc,
  setNewCollDesc,
  handleCreateCollection,
  handleDeleteCollection,
  onBackToAll,
}: CollectionsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <button
          onClick={() => setIsCreatingColl(!isCreatingColl)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition"
        >
          <FolderPlus className="h-4 w-4" />
          Nouvelle Collection
        </button>
      </div>

      {/* New Collection Form */}
      {isCreatingColl && (
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
              onClick={() => setIsCreatingColl(false)}
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
      )}

      {/* Collections Badges / Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCollId(null)}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedCollId === null
              ? "bg-indigo-600 text-white shadow-md"
              : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Toutes les collections ({collections.length})
        </button>

        {collections.map((coll) => (
          <div key={coll.id} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedCollId(coll.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedCollId === coll.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white"
              }`}
            >
              <Folder className="h-3 w-3 text-indigo-400" />
              <span>{coll.name}</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold">
                {coll.gameIds.length}
              </span>
            </button>
            <button
              onClick={() => handleDeleteCollection(coll.id)}
              title="Supprimer la collection"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
