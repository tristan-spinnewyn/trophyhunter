"use client";

import {
  Star,
  ExternalLink,
  BookOpen,
  Trophy,
  Video,
  Gamepad2,
  Check,
  Plus,
  ArrowLeft,
} from "lucide-react";
import type { GameDetails } from "@/lib/types";

interface GameHeaderProps {
  game: GameDetails;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isOwned?: boolean;
  onToggleOwned?: () => void;
  onBackToLibrary?: () => void;
}

export default function GameHeader({
  game,
  isFavorite,
  onToggleFavorite,
  isOwned = false,
  onToggleOwned,
  onBackToLibrary,
}: GameHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* Background cover with gradient blur */}
      <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-slate-950">
        <img
          src={game.headerImg}
          alt={game.name}
          className="h-full w-full object-cover object-center filter blur-[1px] opacity-60 transition duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />

        {/* Back to Library / Account Button */}
        {onBackToLibrary && (
          <button
            onClick={onBackToLibrary}
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-sky-500/50 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ma Bibliothèque</span>
          </button>
        )}

        {/* Top-Right Action Buttons: Owned Library + Favorite */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {onToggleOwned && (
            <button
              onClick={onToggleOwned}
              className={`flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-xs font-bold backdrop-blur-md transition ${
                isOwned
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-700/60 bg-slate-950/70 text-slate-300 hover:border-sky-500/50 hover:text-white"
              }`}
              title={
                isOwned
                  ? "Retirer de mes jeux possédés"
                  : "Ajouter à mes jeux possédés"
              }
            >
              {isOwned ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Possédé</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-sky-400" />
                  <span>Ajouter à mes jeux</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onToggleFavorite}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-md transition ${
              isFavorite
                ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                : "border-slate-700/60 bg-slate-950/60 text-slate-400 hover:text-white"
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Game Info Card Content */}
      <div className="relative -mt-16 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={game.headerImg}
              alt={game.name}
              className="h-20 w-32 sm:h-24 sm:w-40 rounded-2xl object-cover shadow-2xl border-2 border-slate-700/80 bg-slate-800 shrink-0"
            />
            <div className="space-y-1 pt-2 sm:pt-4">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-2">
                {game.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-sky-400">
                  {game.totalAchievements} succès
                </span>
                {game.developers && game.developers.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{game.developers.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Link Buttons (Steam Guides, PSTHC, YouTube) */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <a
            href={game.guideLinks.psthcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Trophy className="h-3.5 w-3.5" />
            Guide PSTHC (FR)
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={game.guideLinks.steamGuidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guides Steam
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={game.guideLinks.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <Video className="h-3.5 w-3.5" />
            Vidéos YouTube FR
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href={`https://store.steampowered.com/app/${game.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/80"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Magasin Steam
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
}
