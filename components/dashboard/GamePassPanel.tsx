// components/dashboard/GamePassPanel.tsx
"use client";

import { MonitorPlay } from "lucide-react";
import type { GamePassPanelProps } from "./gamepass/GamePassPanel.types";
import { GamePassToolbar } from "./gamepass/GamePassToolbar";
import { GamePassCard } from "./gamepass/GamePassCard";
import { isGameInLibrary } from "./gamepass/gamepassFilter.services";
import { useGamePassCatalog } from "./hooks/useGamePassCatalog";

export default function GamePassPanel({
  ownedGames, wishlistIds, onAddGameToXbox, onToggleWishlist, onSelectGame, onBackToAll,
}: GamePassPanelProps) {
  const gp = useGamePassCatalog(ownedGames);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAll}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
        >
          ← Retour à la Vue Globale
        </button>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 flex items-center gap-1.5">
          <MonitorPlay className="h-3.5 w-3.5" />
          {gp.filteredGames.length} / {gp.catalog.length} jeux PC Game Pass
        </span>
      </div>

      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-emerald-400" />
            Catalogue Officiel PC Game Pass (En Direct)
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Explorez l&apos;intégralité des jeux actuellement inclus dans l&apos;abonnement PC Game Pass en France.
            Ajoutez-les en un clic à votre bibliothèque Xbox/PC ou à votre liste d&apos;envies pour suivre leurs succès.
          </p>
        </div>

        <GamePassToolbar
          searchQuery={gp.searchQuery}
          onSearchChange={gp.setSearchQuery}
          categoryFilter={gp.categoryFilter}
          onCategoryChange={gp.setCategoryFilter}
          featureFilter={gp.featureFilter}
          onFeatureFilterChange={gp.setFeatureFilter}
          categories={gp.categories}
          isLoading={gp.isLoading}
          onRefresh={() => void gp.loadCatalog(true)}
        />
      </div>

      {gp.isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-emerald-300 animate-pulse">
            Synchronisation du catalogue officiel PC Game Pass...
          </p>
          <p className="text-xs text-slate-400">Récupération des titres auprès de Microsoft Store.</p>
        </div>
      ) : gp.error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-300">{gp.error}</p>
          <button
            onClick={() => void gp.loadCatalog(true)}
            className="rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/30"
          >
            Réessayer
          </button>
        </div>
      ) : gp.visibleGames.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-1">
          <p className="text-sm font-bold text-white">Aucun jeu PC Game Pass trouvé</p>
          <p className="text-xs text-slate-400">Modifiez votre recherche ou vos filtres.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gp.visibleGames.map((item) => (
              <GamePassCard
                key={item.storeId}
                item={item}
                isOwned={isGameInLibrary(item, ownedGames)}
                isWishlisted={wishlistIds.includes(item.appId)}
                onAddGameToXbox={onAddGameToXbox}
                onToggleWishlist={onToggleWishlist}
                onSelectGame={onSelectGame}
              />
            ))}
          </div>
          {gp.hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={gp.handleLoadMore}
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-5 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
              >
                Afficher plus de jeux ({gp.visibleGames.length} / {gp.filteredGames.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
