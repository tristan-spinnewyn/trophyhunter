// components/dashboard/collections/CollectionsList.tsx

import { Folder, Trash2 } from "lucide-react";
import type { CollectionWithGames } from "@/lib/types";

interface CollectionsListProps {
  collections: CollectionWithGames[];
  selectedCollId: string | null;
  setSelectedCollId: (id: string | null) => void;
  handleDeleteCollection: (id: string) => void;
}

export function CollectionsList({
  collections,
  selectedCollId,
  setSelectedCollId,
  handleDeleteCollection,
}: CollectionsListProps) {
  return (
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
  );
}
