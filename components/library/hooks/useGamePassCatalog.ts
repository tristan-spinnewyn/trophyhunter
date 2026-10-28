// components/library/hooks/useGamePassCatalog.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { OwnedGame } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";
import type { GamePassFeatureFilter } from "@/lib/gamepass/gamepass.types";
import {
  extractGamePassCategories,
  filterGamePassCatalog,
} from "@/lib/gamepass/catalog-filter.services";

interface GamePassApiResponse {
  readonly games?: readonly GamePassCatalogItem[];
  readonly error?: string;
}

export function useGamePassCatalog(ownedGames: readonly OwnedGame[]) {
  const [catalog, setCatalog] = useState<readonly GamePassCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<GamePassFeatureFilter>("all");
  const [visibleLimit, setVisibleLimit] = useState<number>(48);

  const loadCatalog = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = forceRefresh ? "/api/gamepass/pc?refresh=1" : "/api/gamepass/pc";
      const res = await fetch(endpoint);
      const data = (await res.json()) as GamePassApiResponse;
      if (!res.ok) {
        throw new Error(data.error || `Erreur HTTP ${res.status}`);
      }
      setCatalog(Array.isArray(data.games) ? data.games : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement du catalogue.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog(false);
  }, [loadCatalog]);

  const categories = useMemo(() => extractGamePassCategories(catalog), [catalog]);

  const filteredGames = useMemo(
    () =>
      filterGamePassCatalog({
        catalog,
        ownedGames,
        searchQuery,
        categoryFilter,
        featureFilter,
      }),
    [catalog, ownedGames, searchQuery, categoryFilter, featureFilter]
  );

  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleLimit),
    [filteredGames, visibleLimit]
  );

  const handleLoadMore = useCallback(() => {
    setVisibleLimit((prev) => prev + 48);
  }, []);

  return {
    catalog,
    filteredGames,
    visibleGames,
    hasMore: visibleGames.length < filteredGames.length,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    featureFilter,
    setFeatureFilter,
    categories,
    loadCatalog,
    handleLoadMore,
  };
}
