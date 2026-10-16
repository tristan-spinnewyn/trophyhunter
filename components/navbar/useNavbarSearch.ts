// components/navbar/useNavbarSearch.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { GameSearchResult } from "@/lib/types";

interface UseNavbarSearchParams {
  onSelectGame?: (appId: number) => void;
}

export function useNavbarSearch({ onSelectGame }: UseNavbarSearchParams) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.games || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickGame = (appId: number) => {
    setIsOpen(false);
    setQuery("");
    if (onSelectGame) onSelectGame(appId);
    router.push(`/game/${appId}`);
  };

  return {
    query,
    setQuery,
    results,
    setResults,
    isLoading,
    isOpen,
    setIsOpen,
    searchRef,
    handlePickGame,
  };
}
