// components/auth/AuthModalForm.tsx
"use client";

import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AuthFormFields } from "./AuthFormFields";

interface FormProps {
  readonly mode: "login" | "register";
  readonly setMode: (m: "login" | "register") => void;
  readonly username: string;
  readonly setUsername: (u: string) => void;
  readonly password: string;
  readonly setPassword: (p: string) => void;
  readonly displayName: string;
  readonly setDisplayName: (d: string) => void;
  readonly isLoading: boolean;
  readonly errorMsg: string | null;
  readonly successMsg: string | null;
  readonly onSubmit: (e: React.FormEvent) => void;
}

export function AuthModalForm({
  mode,
  setMode,
  username,
  setUsername,
  password,
  setPassword,
  displayName,
  setDisplayName,
  isLoading,
  errorMsg,
  successMsg,
  onSubmit,
}: FormProps) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
          <UserCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            {mode === "login" ? "Connexion au compte" : "Créer un compte"}
          </h3>
          <p className="text-xs text-slate-400">
            Authentification sécurisée & stockage chiffré
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
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
          onClick={() => setMode("register")}
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

      <form onSubmit={onSubmit} className="space-y-3.5">
        <AuthFormFields
          mode={mode}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          displayName={displayName}
          setDisplayName={setDisplayName}
        />

        <div className="flex items-start gap-2 rounded-xl bg-slate-950/50 p-2.5 text-[11px] text-slate-400 border border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Vos clés API et sessions sont isolées et stockées de façon chiffrée
            (AES-256-GCM).
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
  );
}
