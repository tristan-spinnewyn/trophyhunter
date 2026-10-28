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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl space-y-6">
      <div className="grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950 p-1">
        <button
          type="button" onClick={() => setMode("login")}
          className={`rounded-xl py-2 text-xs font-bold transition ${mode === "login" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Se connecter
        </button>
        <button
          type="button" onClick={() => setMode("register")}
          className={`rounded-xl py-2 text-xs font-bold transition ${mode === "register" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Créer un profil
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>

        {mode === "register" && (
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nom d'affichage (Optionnel)"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        )}

        <div className="relative">
          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit" disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {mode === "login" ? "Accéder à ma bibliothèque" : "Démarrer avec SQLite"}
        </button>
      </form>
    </div>
  );
}
