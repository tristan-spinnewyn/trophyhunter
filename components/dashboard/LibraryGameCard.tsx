"use client";

import {
  Trophy,
  Clock,
  ChevronRight,
  Heart,
  FolderPlus,
  Unlink,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { OwnedGame, PlatformAccount, PlatformType } from "@/lib/types";
import { PLATFORM_META, LocalCollection } from "@/lib/storage";

interface LibraryGameCardProps {
  game: OwnedGame;
  steamAccount?: PlatformAccount;
  activePlatformTab: string;
  selectedCollId: string | null;
  wishlistIds: number[];
  collections: LocalCollection[];
  onSelectGame: (appId: number) => void;
  onToggleWishlist: (appId: number, platform: PlatformType) => void;
  onOpenAddToCollection: (game: OwnedGame) => void;
  onRemoveFromCollection: (
    collectionId: string,
    appId: number,
    platform: PlatformType
  ) => void;
  onSyncGame: (game: OwnedGame) => Promise<void>;
  onRemoveGame: (appId: number, platform: PlatformType) => Promise<void>;
}

export default function LibraryGameCard({
  game: g,
  steamAccount,
  activePlatformTab,
  selectedCollId,
  wishlistIds,
  collections,
  onSelectGame,
  onToggleWishlist,
  onOpenAddToCollection,
  onRemoveFromCollection,
  onSyncGame,
  onRemoveGame,
}: LibraryGameCardProps) {
  const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;
  const isPlatinum =
    g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;
  const pct =
    g.totalAchievements > 0
      ? Math.min(100, Math.round((g.unlockedCount / g.totalAchievements) * 100))
      : 0;

  const canSync =
    (g.platform === "steam" && !!steamAccount?.username) ||
    g.platform === "epic";

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition duration-300 hover:shadow-xl ${
        isPlatinum
          ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 hover:border-amber-500/70"
          : "border-slate-800 bg-slate-900/90 hover:border-sky-500/50"
      }`}
    >
      {/* Cover Image */}
      <div
        onClick={() => onSelectGame(g.appId)}
        className="relative h-28 w-full cursor-pointer overflow-hidden bg-slate-900"
      >
        <img
          src={g.headerImg}
          alt={g.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Platform Badge */}
        <span
          className={`absolute left-2.5 top-2.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${pMeta.badgeClass}`}
        >
          {pMeta.shortName}
        </span>

        {/* Platinum Badge or Achievement Badge */}
        {isPlatinum ? (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 backdrop-blur-md">
            <Trophy className="h-3 w-3 fill-amber-400" />
            100%
          </span>
        ) : g.totalAchievements > 0 ? (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md">
            <Trophy className="h-2.5 w-2.5 text-amber-400" />
            {g.totalAchievements} {g.platform === "epic" ? "XP" : "succès"}
          </span>
        ) : (
          <span className="absolute right-2.5 top-2.5 rounded-lg border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold text-slate-400 backdrop-blur-md">
            Sans succès
          </span>
        )}

        {/* Playtime */}
        {g.playtimeHours !== undefined && g.playtimeHours > 0 && (
          <span className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-slate-300">
            <Clock className="h-2.5 w-2.5 text-sky-400" />
            {g.playtimeHours} h
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between p-3 space-y-2.5">
        <div onClick={() => onSelectGame(g.appId)} className="cursor-pointer">
          <h4 className="truncate text-sm font-bold text-white group-hover:text-sky-400">
            {g.name}
          </h4>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {g.totalAchievements > 0
                ? `${g.unlockedCount} / ${g.totalAchievements} succès`
                : "⚪ Aucun succès répertorié"}
            </span>
            <span
              className={`font-bold ${
                isPlatinum
                  ? "text-amber-400"
                  : pct > 0
                  ? "text-sky-400"
                  : "text-slate-500"
              }`}
            >
              {g.totalAchievements > 0 ? `${pct}%` : "—"}
            </span>
          </div>

          {/* Mini Progress Bar */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                isPlatinum
                  ? "bg-gradient-to-r from-amber-400 to-emerald-400"
                  : "bg-sky-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/70">
          <button
            onClick={() => onSelectGame(g.appId)}
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
          >
            Ouvrir les succès
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1">
            {/* Wishlist Toggle Button */}
            <button
              onClick={() => onToggleWishlist(g.appId, g.platform)}
              title={
                wishlistIds.includes(g.appId)
                  ? "Retirer de ma liste d'envies"
                  : "Ajouter à ma liste d'envies"
              }
              className={`rounded-lg p-1 transition ${
                wishlistIds.includes(g.appId)
                  ? "text-rose-400 bg-rose-500/10"
                  : "text-slate-500 hover:bg-slate-800 hover:text-rose-400"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  wishlistIds.includes(g.appId) ? "fill-current" : ""
                }`}
              />
            </button>

            {/* Add to Collection Button */}
            {collections.length > 0 && (
              <button
                onClick={() => onOpenAddToCollection(g)}
                title="Ajouter à une collection"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-indigo-400 transition"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Remove from Collection Button if inside a specific collection */}
            {activePlatformTab === "collections" && selectedCollId && (
              <button
                onClick={() =>
                  onRemoveFromCollection(selectedCollId, g.appId, g.platform)
                }
                title="Retirer de cette collection"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-400 transition"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            )}

            {canSync && (
              <button
                onClick={() => onSyncGame(g)}
                title={
                  g.platform === "epic"
                    ? "Synchroniser les succès avec Epic Games"
                    : "Actualiser les succès Steam de ce jeu"
                }
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={() => onRemoveGame(g.appId, g.platform)}
              title="Retirer de ma bibliothèque"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
