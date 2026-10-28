// components/navbar/NavbarUserActions.tsx

import { UserRound, Settings, ShieldCheck, LogOut } from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface UserActionsProps {
  readonly currentUser?: UserType | null;
  readonly onLogout: () => void;
  readonly onOpenAuth: () => void;
  readonly onOpenSettings: () => void;
}

export function NavbarUserActions({
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenSettings,
}: UserActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onOpenAuth}
        title={
          currentUser
            ? `Connecté en tant que @${currentUser.username}`
            : "Connexion / Inscription"
        }
        aria-label={currentUser ? `Compte @${currentUser.username}` : "Connexion"}
        className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
          currentUser
            ? "text-slate-200 hover:bg-slate-900"
            : "bg-sky-500 text-slate-950 hover:bg-sky-400"
        }`}
      >
        {currentUser ? (
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <UserRound className="h-4 w-4 shrink-0" />
        )}
        <span className="hidden sm:inline max-w-[110px] truncate">
          {currentUser ? `@${currentUser.username}` : "Connexion"}
        </span>
      </button>

      {currentUser && (
        <button
          type="button"
          onClick={onLogout}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenSettings}
        title="Paramètres & Sauvegarde"
        aria-label="Paramètres & Sauvegarde"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
