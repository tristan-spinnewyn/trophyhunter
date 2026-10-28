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
      <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
        Aucun jeu ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-4">
      <Gamepad2 className="h-8 w-8 text-slate-500 mx-auto" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">Ta collection est vide</p>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Lie un compte pour importer tes jeux automatiquement, ou ajoute-les un par un.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          <Link2 className="h-4 w-4" />
          Lier un compte
        </Link>
        <button
          type="button"
          onClick={onOpenAddGame}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Ajouter un jeu
        </button>
      </div>
    </div>
  );
}
