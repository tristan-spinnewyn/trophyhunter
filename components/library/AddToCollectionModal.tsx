import { FolderPlus } from "lucide-react";
import type { OwnedGame, CollectionWithGames } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

interface AddToCollectionModalProps {
  game: OwnedGame | null;
  collections: CollectionWithGames[];
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
    <Modal
      title="Ajouter à une collection"
      icon={<FolderPlus className="h-4 w-4 text-paused" />}
      onClose={onClose}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-paper-dim">
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
                className="flex w-full items-center justify-between rounded-control border border-edge bg-ink p-2.5 text-xs text-left transition hover:border-paused/50 disabled:opacity-50"
              >
                <span className="font-semibold text-paper">{c.name}</span>
                <span className="text-[11px] text-dust">
                  {alreadyIn ? "Déjà présent ✓" : "Ajouter +"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
