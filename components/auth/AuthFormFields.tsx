// components/auth/AuthFormFields.tsx

import { User, Lock } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/lib/accounts/password-policy";

interface FieldsProps {
  mode: "login" | "register";
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  displayName: string;
  setDisplayName: (d: string) => void;
}

export function AuthFormFields({
  mode,
  username,
  setUsername,
  password,
  setPassword,
  displayName,
  setDisplayName,
}: FieldsProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Nom d&apos;utilisateur</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="tristan"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Nom d&apos;affichage (Optionnel)</label>
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tristan S."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
        {mode === "register" && (
          <p className="mt-1 text-[11px] text-slate-500">
            Minimum {MIN_PASSWORD_LENGTH} caractères (haché par scrypt avec sel aléatoire).
          </p>
        )}
      </div>
    </>
  );
}
