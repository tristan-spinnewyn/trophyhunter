"use client";

import { useState } from "react";
import {
  X,
  User,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  LogOut,
} from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onAuthSuccess: (user: UserType) => void;
  onLogout: () => void;
  onSyncLocalData?: () => Promise<void>;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  onSyncLocalData,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
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
          ? "Compte créé avec succès ! Session active."
          : "Connexion réussie !"
      );
      onAuthSuccess(data.user);

      // Auto-sync local data if requested
      if (onSyncLocalData) {
        setIsSyncing(true);
        try {
          await onSyncLocalData();
        } catch {
          // ignore sync error
        } finally {
          setIsSyncing(false);
        }
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'opération.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onLogout();
      setSuccessMsg("Déconnexion réussie.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      setErrorMsg("Erreur lors de la déconnexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {currentUser ? (
          /* User Logged In State */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {currentUser.displayName || currentUser.username}
                </h3>
                <p className="text-xs text-slate-400">@{currentUser.username}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <Database className="h-3 w-3" />
                  Base de données SQLite connectée
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Sécurité & Chiffrement
              </div>
              <p className="text-xs text-slate-400">
                Vos clés API Steam et vos accès sont chiffrés en <strong>AES-256-GCM</strong>.
                Aucune clé n&apos;est stockée en clair.
              </p>

              {onSyncLocalData && (
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      await onSyncLocalData();
                      setSuccessMsg("Données locales migrées avec succès vers SQLite !");
                    } catch {
                      setErrorMsg("Échec de la synchronisation locale.");
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Database className="h-3.5 w-3.5" />
                  )}
                  {isSyncing
                    ? "Synchronisation..."
                    : "Synchroniser mes données locales vers SQLite"}
                </button>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Se déconnecter
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {mode === "login" ? "Connexion au compte" : "Créer un compte"}
                </h3>
                <p className="text-xs text-slate-400">
                  Base SQLite locale sécurisée & stockage chiffré
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mb-4 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                  mode === "login"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                  mode === "register"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Créer un compte
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nom d&apos;utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tristan"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nom d&apos;affichage (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tristan S."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Minimum 6 caractères (haché par scrypt avec sel aléatoire).
                </p>
              </div>

              {/* Security guarantee note */}
              <div className="flex items-start gap-2 rounded-xl bg-slate-950/50 p-2.5 text-[11px] text-slate-400 border border-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Vos clés API et sessions sont isolées et stockées de façon chiffrée (AES-256-GCM) dans SQLite.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500 disabled:opacity-50 shadow-md shadow-sky-600/20"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
