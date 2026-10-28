// components/library/hooks/useAddGameSearch.ts
"use client";

import { useState } from "react";
import type { GameSearchResult } from "@/lib/types";

export function useAddGameSearch() {
  const [addGameQuery, setAddGameQuery] = useState("");
  const [addGameResults, setAddGameResults] = useState<GameSearchResult[]>([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);

  const handleSearchAddGame = async (q: string) => {
    setAddGameQuery(q);
    if (q.trim().length < 2) {
      setAddGameResults([]);
      return;
    }
    setIsSearchingAdd(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setAddGameResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingAdd(false);
    }
  };

  return {
    addGameQuery,
    setAddGameQuery,
    addGameResults,
    setAddGameResults,
    isSearchingAdd,
    handleSearchAddGame,
  };
}
