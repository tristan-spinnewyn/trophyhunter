// components/auth/AuthModalForm.tsx
"use client";

import {
  ArrowRight,
  ShieldCheck,
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
      <p className="mb-4 text-sm text-dust">
        Authentification sécurisée, stockage chiffré.
      </p>

      <div className="mb-4 grid grid-cols-2 rounded-control border border-edge bg-ink p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-control py-1.5 text-xs font-semibold transition ${
            mode === "login"
              ? "bg-lamp text-paper shadow-sm"
              : "text-dust hover:text-paper"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-control py-1.5 text-xs font-semibold transition ${
            mode === "register"
              ? "bg-lamp text-paper shadow-sm"
              : "text-dust hover:text-paper"
          }`}
        >
          Créer un compte
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-control border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-control border border-done/30 bg-done/10 p-3 text-xs text-done">
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

        <div className="flex items-start gap-2 rounded-control bg-ink/50 p-2.5 text-[11px] text-dust border border-edge">
          <ShieldCheck className="h-4 w-4 text-done shrink-0 mt-0.5" />
          <span>
            Vos clés API et sessions sont isolées et stockées de façon chiffrée
            (AES-256-GCM).
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-lamp px-4 py-2.5 text-xs font-bold text-paper transition hover:bg-lamp disabled:opacity-50"
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
