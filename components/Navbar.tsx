"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Settings,
  User,
  Gamepad2,
  Database,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useUserData } from "@/context/UserDataContext";
import { NavbarSearch } from "@/components/NavbarSearch";

interface NavbarProps {
  onSelectGame?: (appId: number) => void;
}

export default function Navbar({ onSelectGame }: NavbarProps) {
  const pathname = usePathname();
  const {
    accountProfile,
    ownedGames,
    currentUser,
    handleLogout,
    setIsAuthOpen,
    setIsSettingsOpen,
  } = useUserData();

  const steamAcc = accountProfile?.accounts?.steam;
  const isLibraryActive = pathname === "/";
  const isAccountActive = pathname === "/account";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5 px-4 py-3">
        {/* Brand */}
        <Link
          href="/"
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
        </Link>

        {/* Navigation tabs */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              isLibraryActive
                ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Bibliothèque</span>
            {ownedGames.length > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                  isLibraryActive
                    ? "bg-slate-950/20 text-slate-950 font-black"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {ownedGames.length}
              </span>
            )}
          </Link>

          <Link
            href="/account"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              isAccountActive
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Comptes & Plateformes</span>
          </Link>
        </div>

        {/* Search input with autocomplete dropdown */}
        <NavbarSearch onSelectGame={onSelectGame} />

        {/* Right Actions: Account Link, Auth & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/account"
            className={`flex md:hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              isAccountActive
                ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : "border-slate-700/80 bg-slate-900 text-slate-200 hover:border-sky-500/50 hover:text-white"
            }`}
            title="Mon Compte & Plateformes"
          >
            {steamAcc?.avatarUrl ? (
              <img
                src={steamAcc.avatarUrl}
                alt={steamAcc.displayName}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-purple-400" />
            )}
          </Link>

          <button
            onClick={() => setIsAuthOpen(true)}
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

          {currentUser && (
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Quitter</span>
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
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
