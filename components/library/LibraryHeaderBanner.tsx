"use client";

import Link from "next/link";
import { Gamepad2, User, Plus } from "lucide-react";

interface LibraryHeaderBannerProps {
  ownedGamesCount: number;
  onOpenAddGame: () => void;
}

export function LibraryHeaderBanner({
  ownedGamesCount,
  onOpenAddGame,
}: LibraryHeaderBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Ma Bibliothèque Multi-Plateforme
          </h2>
          <p className="text-xs text-slate-400">
            {ownedGamesCount} jeux suivis • Steam, Xbox, Epic Games & GOG
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
        >
          <User className="h-3.5 w-3.5 text-purple-400" />
          <span>Gérer mes comptes & plateformes</span>
        </Link>
        <button
          onClick={onOpenAddGame}
          className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter un jeu</span>
        </button>
      </div>
    </div>
  );
}
