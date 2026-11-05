// components/library/section/LibrarySectionEmptyState.tsx

import Link from "next/link";
import { Gamepad2, Link2, Plus } from "lucide-react";

interface LibrarySectionEmptyStateProps {
  totalOwnedGamesCount: number;
  onOpenAddGame: () => void;
}

export function LibrarySectionEmptyState({
  totalOwnedGamesCount,
  onOpenAddGame,
}: LibrarySectionEmptyStateProps) {
  if (totalOwnedGamesCount > 0) {
    return (
      <p className="rounded-control border border-dashed border-edge p-6 text-center text-sm text-dust">
        Aucun jeu ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className="rounded-control border border-dashed border-edge p-8 text-center space-y-4">
      <Gamepad2 className="h-8 w-8 text-faint mx-auto" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-paper">Ta collection est vide</p>
        <p className="text-sm text-dust max-w-md mx-auto">
          Lie un compte pour importer tes jeux automatiquement, ou ajoute-les un par un.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-control bg-lamp px-4 py-2 text-sm font-semibold text-ink hover:bg-lamp-bright"
        >
          <Link2 className="h-4 w-4" />
          Lier un compte
        </Link>
        <button
          type="button"
          onClick={onOpenAddGame}
          className="inline-flex items-center gap-1.5 rounded-control border border-seam px-4 py-2 text-sm text-paper hover:bg-edge"
        >
          <Plus className="h-4 w-4" />
          Ajouter un jeu
        </button>
      </div>
    </div>
  );
}
