"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, Sparkles } from "lucide-react";
import type { GameSearchResult } from "@/lib/types";

// Popular games for achievement hunters as quick launch suggestions
export const POPULAR_GAMES: GameSearchResult[] = [
  {
    id: 1091500,
    name: "Cyberpunk 2077",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
  },
  {
    id: 1245620,
    name: "ELDEN RING",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
  },
  {
    id: 367520,
    name: "Hollow Knight",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
  },
  {
    id: 292030,
    name: "The Witcher 3: Wild Hunt",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
  },
  {
    id: 1086940,
    name: "Baldur's Gate 3",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
  },
  {
    id: 2050650,
    name: "Resident Evil 4",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg",
  },
  {
    id: 504230,
    name: "Celeste",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg",
  },
  {
    id: 105600,
    name: "Terraria",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg",
  },
];

interface NavbarSearchProps {
  onSelectGame?: (appId: number) => void;
}

export function NavbarSearch({ onSelectGame }: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
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

  // Click outside to close
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
    if (onSelectGame) {
      onSelectGame(appId);
    }
    router.push(`/game/${appId}`);
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-md">
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
          placeholder="Chercher un jeu (ex: Cyberpunk...)"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2 pl-9 pr-8 text-xs sm:text-sm text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              Recherche sur Steam...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Résultats Steam
              </div>
              {results.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handlePickGame(g.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
                >
                  <img
                    src={g.img}
                    alt={g.name}
                    className="h-10 w-20 rounded-lg object-cover bg-slate-950"
                  />
                  <div className="flex-1 truncate">
                    <div className="truncate text-sm font-semibold text-white group-hover:text-sky-400">
                      {g.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      AppID: {g.id}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-6 text-center text-sm text-slate-400">
              Aucun jeu trouvé pour &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-2 p-1">
              <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Jeux populaires
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {POPULAR_GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handlePickGame(g.id)}
                    className="flex items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
                  >
                    <img
                      src={g.img}
                      alt={g.name}
                      className="h-9 w-16 rounded-md object-cover bg-slate-950"
                    />
                    <div className="truncate text-xs font-semibold text-slate-200 group-hover:text-sky-400">
                      {g.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
