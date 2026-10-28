// components/NavbarSearch.tsx
"use client";

import { Search, X } from "lucide-react";
import { useNavbarSearch } from "./navbar/useNavbarSearch";
import { SearchResultsDropdown } from "./navbar/SearchResultsDropdown";
import { POPULAR_GAMES } from "./navbar/popularGames";

export { POPULAR_GAMES };

interface NavbarSearchProps {
  onSelectGame?: (appId: number) => void;
}

export function NavbarSearch({ onSelectGame }: NavbarSearchProps) {
  const {
    query,
    setQuery,
    results,
    setResults,
    isLoading,
    isOpen,
    setIsOpen,
    searchRef,
    handlePickGame,
  } = useNavbarSearch({ onSelectGame });

  return (
    <div ref={searchRef} className="relative flex-1 min-w-0 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un jeu…"
          aria-label="Rechercher un jeu"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-8 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Effacer la recherche"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <SearchResultsDropdown
          isLoading={isLoading}
          results={results}
          query={query}
          onPickGame={handlePickGame}
        />
      )}
    </div>
  );
}
