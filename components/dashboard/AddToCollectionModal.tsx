import { FolderPlus } from "lucide-react";
import type { OwnedGame } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

interface AddToCollectionModalProps {
  game: OwnedGame | null;
  collections: LocalCollection[];
  onClose: () => void;
  onAddToCollection: (collectionId: string, game: OwnedGame) => void;
}

export default function AddToCollectionModal({
  game,
  collections,
  onClose,
  onAddToCollection,
}: AddToCollectionModalProps) {
  if (!game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-indigo-400" />
            Ajouter à une collection
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-300">
          Choisir une collection pour <strong>{game.name}</strong> :
        </p>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {collections.map((c) => {
            const alreadyIn = c.gameIds.includes(game.appId);
            return (
              <button
                key={c.id}
                disabled={alreadyIn}
                onClick={() => onAddToCollection(c.id, game)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-left transition hover:border-indigo-500/50 disabled:opacity-50"
              >
                <span className="font-semibold text-white">{c.name}</span>
                <span className="text-[10px] text-slate-400">
                  {alreadyIn ? "Déjà présent ✓" : "Ajouter +"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
