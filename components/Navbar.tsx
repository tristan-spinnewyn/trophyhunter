"use client";

import { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Search,
  Loader2,
  Settings,
  X,
  Sparkles,
  User,
  Gamepad2,
  Database,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type { GameSearchResult, UserAccountProfile, User as UserType } from "@/lib/types";

interface NavbarProps {
  onSelectGame: (appId: number) => void;
  onOpenSettings: () => void;
  favorites: number[];
  activeView: "game" | "account";
  onChangeView: (view: "game" | "account") => void;
  accountProfile?: UserAccountProfile;
  ownedCount?: number;
  currentUser?: UserType | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}


// Popular games for achievement hunters as quick launch suggestions
const POPULAR_GAMES: GameSearchResult[] = [
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

export default function Navbar({
  onSelectGame,
  onOpenSettings,
  activeView,
  onChangeView,
  accountProfile,
  ownedCount = 0,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const steamAcc = accountProfile?.accounts?.steam;

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
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5 px-4 py-3">
        {/* Brand */}
        <div
          onClick={() => {
            setQuery("");
            setIsOpen(false);
            onChangeView("game");
          }}
          className="flex cursor-pointer items-center gap-2 select-none shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
            <Trophy className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              TrophyHunter
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
                FR
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Chasseur de Succès Multi-Plateforme
            </p>
          </div>
        </div>

        {/* Search input container */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
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
              placeholder="Chercher un jeu (ex: Cyberpunk, Elden Ring...)"
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
            <div className="absolute left-0 right-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  Recherche sur Steam...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Résultats ({results.length})
                  </div>
                  {results.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        onSelectGame(game.id);
                        onChangeView("game");
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-800"
                    >
                      <img
                        src={game.img}
                        alt={game.name}
                        className="h-10 w-20 rounded-lg object-cover bg-slate-800"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-white">
                          {game.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          AppID: {game.id} {game.price ? `• ${game.price}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Aucun jeu trouvé pour &quot;{query}&quot;
                </div>
              ) : (
                <div className="space-y-1.5 p-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Jeux populaires à platiner
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {POPULAR_GAMES.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => {
                          onSelectGame(game.id);
                          onChangeView("game");
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800"
                      >
                        <img
                          src={game.img}
                          alt={game.name}
                          className="h-9 w-16 rounded-md object-cover bg-slate-800"
                        />
                        <span className="truncate text-xs font-medium text-slate-200">
                          {game.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Account/Library Button & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() =>
              onChangeView(activeView === "account" ? "game" : "account")
            }
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              activeView === "account"
                ? "border-sky-500 bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                : "border-slate-700/80 bg-slate-900 text-slate-200 hover:border-sky-500/50 hover:text-white"
            }`}
            title="Mon Compte, Plateformes & Jeux Possédés"
          >
            {steamAcc?.avatarUrl ? (
              <img
                src={steamAcc.avatarUrl}
                alt={steamAcc.displayName}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-sky-400" />
            )}
            <span className="hidden md:inline max-w-[110px] truncate">
              {steamAcc?.displayName || "Mon Compte"}
            </span>
            {ownedCount > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  activeView === "account"
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {ownedCount}
              </span>
            )}
          </button>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title={
                currentUser
                  ? `Connecté en tant que @${currentUser.username} (Base SQLite)`
                  : "Connexion / Inscription SQLite (Sécurisé)"
              }
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                currentUser
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-500/50 hover:text-white"
              }`}
            >
              {currentUser ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Database className="h-4 w-4 text-sky-400 shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">
                {currentUser ? `@${currentUser.username}` : "Connexion"}
              </span>
            </button>
          )}

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Quitter</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Paramètres & Sauvegarde"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
