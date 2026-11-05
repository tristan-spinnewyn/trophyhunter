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
        <label className="block text-xs font-medium text-paper-dim mb-1">Nom d&apos;utilisateur</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
          <input
            type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="tristan"
            className="w-full rounded-xl border border-seam bg-ink py-2 pl-9 pr-3 text-xs text-paper placeholder-faint outline-none focus:border-lamp"
          />
        </div>
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-xs font-medium text-paper-dim mb-1">Nom d&apos;affichage (Optionnel)</label>
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tristan S."
            className="w-full rounded-xl border border-seam bg-ink px-3 py-2 text-xs text-paper placeholder-faint outline-none focus:border-lamp"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-paper-dim mb-1">Mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
            placeholder="••••••••"
            className="w-full rounded-xl border border-seam bg-ink py-2 pl-9 pr-3 text-xs text-paper placeholder-faint outline-none focus:border-lamp"
          />
        </div>
        {mode === "register" && (
          <p className="mt-1 text-[11px] text-faint">
            Minimum {MIN_PASSWORD_LENGTH} caractères (haché par scrypt avec sel aléatoire).
          </p>
        )}
      </div>
    </>
  );
}
