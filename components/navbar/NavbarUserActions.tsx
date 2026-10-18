// components/navbar/NavbarUserActions.tsx

import Link from "next/link";
import { User, Settings, ShieldCheck, LogOut } from "lucide-react";
import type { User as UserType, PlatformAccount } from "@/lib/types";

interface UserActionsProps {
  readonly pathname: string;
  readonly steamAcc?: PlatformAccount;
  readonly currentUser?: UserType | null;
  readonly onLogout: () => void;
  readonly onOpenAuth: () => void;
  readonly onOpenSettings: () => void;
}

export function NavbarUserActions({
  pathname,
  steamAcc,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenSettings,
}: UserActionsProps) {
  const isAccountActive = pathname === "/account";

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Link
        href="/account"
        className={`flex md:hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
          isAccountActive
            ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/20"
            : "border-slate-700/80 bg-slate-900 text-slate-200 hover:border-sky-500/50 hover:text-white"
        }`}
        title="Mon Compte & Plateformes"
      >
        {steamAcc?.avatarUrl ? (
          <img
            src={steamAcc.avatarUrl}
            alt={steamAcc.displayName}
            className="h-4 w-4 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-purple-400" />
        )}
      </Link>

      <button
        type="button"
        onClick={onOpenAuth}
        title={
          currentUser
            ? `Connecté en tant que @${currentUser.username}`
            : "Connexion / Inscription"
        }
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
          currentUser
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-500/50 hover:text-white"
        }`}
      >
        {currentUser ? (
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <User className="h-4 w-4 text-sky-400 shrink-0" />
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
          className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Quitter</span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenSettings}
        title="Paramètres & Sauvegarde"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
