// components/library/collections/CollectionsList.tsx

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
            ? "bg-paused text-paper shadow-md"
            : "border border-edge bg-plank text-dust hover:text-paper"
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
                ? "bg-paused text-paper shadow-md"
                : "border border-edge bg-plank text-paper-dim hover:border-paused/50 hover:text-paper"
            }`}
          >
            <Folder className="h-3 w-3 text-paused" />
            <span>{coll.name}</span>
            <span className="rounded-full bg-edge px-1.5 py-px text-[11px] font-bold">
              {coll.gameIds.length}
            </span>
          </button>
          <button
            onClick={() => handleDeleteCollection(coll.id)}
            title="Supprimer la collection"
            className="rounded-lg p-1 text-faint hover:bg-edge hover:text-danger transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
