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
        className={`flex h-9 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium transition-[color] ${
          currentUser
            ? "text-paper hover:bg-plank"
            : "bg-lamp text-ink hover:bg-lamp-bright"
        }`}
      >
        {currentUser ? (
          <ShieldCheck className="h-4 w-4 text-done shrink-0" />
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
          className="flex h-9 w-9 items-center justify-center rounded-control text-dust transition hover:bg-plank hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenSettings}
        title="Paramètres & Sauvegarde"
        aria-label="Paramètres & Sauvegarde"
        className="flex h-9 w-9 items-center justify-center rounded-control text-dust transition hover:bg-plank hover:text-paper"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
