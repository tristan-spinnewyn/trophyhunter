"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Database,
  Gamepad2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface AuthGateProps {
  onAuthSuccess: (user: UserType) => void;
}

export default function AuthGate({ onAuthSuccess }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [legacyGamesCount, setLegacyGamesCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawGames = localStorage.getItem("trophyhunter_owned_games");
        const games = rawGames ? JSON.parse(rawGames) : [];
        if (Array.isArray(games) && games.length > 0) {
          setLegacyGamesCount(games.length);
          setMode("register");
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: Record<string, string> = {
        username: username.trim(),
        password,
      };
      if (mode === "register" && displayName.trim()) {
        payload.displayName = displayName.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSuccessMsg(
        mode === "register"
          ? "Compte créé avec succès ! Chargement de votre espace..."
          : "Connexion réussie ! Chargement de votre espace..."
      );

      setTimeout(() => {
        onAuthSuccess(data.user);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-4 max-w-xl mx-auto w-full space-y-8">
      {/* Brand & Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/25">
          <Trophy className="h-9 w-9 text-slate-950 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          TrophyHunter
          <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/30">
            SQLite
          </span>
        </h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Gestionnaire de bibliothèque unifiée et suivi des platines multi-plateforme.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Notice on Database & Authentication */}
        <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3.5 text-xs text-sky-200">
          <Database className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sky-300">
              Authentification requise pour votre base de données
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Vos plateformes (Steam, Xbox, Epic Games, GOG), vos listes de jeux et vos trophées sont désormais chiffrés et sauvegardés de façon persistante dans votre compte.
            </p>
          </div>
        </div>

        {legacyGamesCount > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                Bibliothèque locale détectée ({legacyGamesCount} jeux)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Vos jeux et succès précédents sont conservés dans votre navigateur. Créez votre compte (ou connectez-vous) ci-dessous pour les transférer et les enregistrer définitivement dans votre base SQLite !
              </p>
            </div>
          </div>
        )}

        {/* Tab switch */}
        <div className="grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === "login"
                ? "bg-sky-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === "register"
                ? "bg-sky-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nom d&apos;utilisateur
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: alex"
                autoComplete="username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nom d&apos;affichage (Optionnel)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Alex Platines"
                autoComplete="name"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>
            {mode === "register" && (
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum 6 caractères (haché par scrypt avec sel cryptographique).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-xs font-bold text-slate-950 hover:brightness-110 transition disabled:opacity-50 shadow-lg shadow-sky-500/20"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <ArrowRight className="h-4 w-4 text-slate-950" />
            )}
            <span>
              {mode === "login"
                ? "Accéder à mon espace"
                : "Créer mon compte et initialiser ma base"}
            </span>
          </button>
        </form>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-left space-y-1">
          <Gamepad2 className="h-4 w-4 text-sky-400" />
          <div className="text-xs font-bold text-white">Multi-Plateforme</div>
          <div className="text-[11px] text-slate-400">
            Steam, Xbox Live, Epic Games et GOG Galaxy réunis.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-left space-y-1">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <div className="text-xs font-bold text-white">Chiffrement AES-256</div>
          <div className="text-[11px] text-slate-400">
            Clés API et jetons protégés au repos dans SQLite.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-left space-y-1">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <div className="text-xs font-bold text-white">Succès & Guides</div>
          <div className="text-[11px] text-slate-400">
            Guides, notes personnalisées et synchronisation automatique.
          </div>
        </div>
      </div>
    </div>
  );
}
