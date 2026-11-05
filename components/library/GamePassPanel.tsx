// components/library/GamePassPanel.tsx
"use client";

import { MonitorPlay } from "lucide-react";
import type { GamePassPanelProps } from "./gamepass/GamePassPanel.types";
import { GamePassToolbar } from "./gamepass/GamePassToolbar";
import { GamePassCard } from "./gamepass/GamePassCard";
import { isGameInLibrary } from "@/lib/gamepass/catalog-filter.services";
import { useGamePassCatalog } from "./hooks/useGamePassCatalog";

export default function GamePassPanel({
  ownedGames, wishlistIds, onAddGameToXbox, onToggleWishlist, onSelectGame,
}: GamePassPanelProps) {
  const gp = useGamePassCatalog(ownedGames);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-done/40 bg-done/10 text-done flex items-center gap-1.5">
          <MonitorPlay className="h-3.5 w-3.5" />
          {gp.filteredGames.length} / {gp.catalog.length} jeux PC Game Pass
        </span>
      </div>

      <div className="rounded-2xl border border-done/30 bg-gradient-to-br from-plank via-plank/95 to-done/40 p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-paper flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-done" />
            Catalogue Officiel PC Game Pass (En Direct)
          </h3>
          <p className="text-xs text-paper-dim max-w-2xl leading-relaxed">
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
        <div className="rounded-2xl border border-edge bg-ink/60 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-done animate-pulse">
            Synchronisation du catalogue officiel PC Game Pass...
          </p>
          <p className="text-xs text-dust">Récupération des titres auprès de Microsoft Store.</p>
        </div>
      ) : gp.error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/20 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-danger">{gp.error}</p>
          <button
            onClick={() => void gp.loadCatalog(true)}
            className="rounded-xl bg-danger/20 border border-danger/40 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/30"
          >
            Réessayer
          </button>
        </div>
      ) : gp.visibleGames.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-ink/60 p-8 text-center space-y-1">
          <p className="text-sm font-bold text-paper">Aucun jeu PC Game Pass trouvé</p>
          <p className="text-xs text-dust">Modifiez votre recherche ou vos filtres.</p>
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
                className="rounded-2xl border border-done/40 bg-done/15 px-5 py-2.5 text-xs font-bold text-done transition hover:bg-done/25"
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
