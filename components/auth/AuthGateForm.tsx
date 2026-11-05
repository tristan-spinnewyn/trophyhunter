// components/auth/AuthGateForm.tsx
"use client";

import { User, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormProps {
  mode: "login" | "register";
  setMode: (m: "login" | "register") => void;
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  displayName: string;
  setDisplayName: (d: string) => void;
  isLoading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthGateForm({
  mode, setMode, username, setUsername, password, setPassword,
  displayName, setDisplayName, isLoading, errorMsg, successMsg, onSubmit,
}: FormProps) {
  return (
    <div className="rounded-sheet border border-edge bg-plank/90 p-6 sm:p-8 backdrop-blur-xl space-y-6">
      <div className="grid grid-cols-2 rounded-sheet border border-edge bg-ink p-1">
        <button
          type="button" onClick={() => setMode("login")}
          className={`rounded-control py-2 text-xs font-bold transition ${mode === "login" ? "bg-lamp text-paper" : "text-dust hover:text-paper"}`}
        >
          Se connecter
        </button>
        <button
          type="button" onClick={() => setMode("register")}
          className={`rounded-control py-2 text-xs font-bold transition ${mode === "register" ? "bg-lamp text-paper" : "text-dust hover:text-paper"}`}
        >
          Créer un profil
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-control border border-done/30 bg-done/10 p-3.5 text-xs text-done">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3.5 top-3 h-4 w-4 text-faint" />
          <input
            type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="w-full rounded-sheet border border-seam bg-ink py-2.5 pl-10 pr-4 text-xs sm:text-sm text-paper placeholder-faint outline-none focus:border-lamp"
          />
        </div>

        {mode === "register" && (
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nom d'affichage (Optionnel)"
            className="w-full rounded-sheet border border-seam bg-ink px-4 py-2.5 text-xs sm:text-sm text-paper placeholder-faint outline-none focus:border-lamp"
          />
        )}

        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-faint" />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-sheet border border-seam bg-ink py-2.5 pl-10 pr-4 text-xs sm:text-sm text-paper placeholder-faint outline-none focus:border-lamp"
          />
        </div>

        <button
          type="submit" disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-lamp px-5 py-3 text-sm font-bold text-ink transition hover:bg-lamp-bright disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {mode === "login" ? "Accéder à ma bibliothèque" : "Démarrer avec SQLite"}
        </button>
      </form>
    </div>
  );
}
