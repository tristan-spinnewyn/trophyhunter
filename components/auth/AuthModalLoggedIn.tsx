// components/auth/AuthModalLoggedIn.tsx

import { User, ShieldCheck, LogOut, CheckCircle2 } from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface LoggedInProps {
  readonly currentUser: UserType;
  readonly successMsg: string | null;
  readonly isLoading: boolean;
  readonly onLogout: () => void;
  readonly onClose: () => void;
}

export function AuthModalLoggedIn({
  currentUser,
  successMsg,
  isLoading,
  onLogout,
  onClose,
}: LoggedInProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-sheet bg-lamp/10 text-lamp-bright border border-lamp/30">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-paper">
            {currentUser.displayName || currentUser.username}
          </h3>
          <p className="text-xs text-dust">@{currentUser.username}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-done">
            <ShieldCheck className="h-3.5 w-3.5" /> Session active & synchronisée
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-control border border-done/30 bg-done/10 p-3 text-xs text-done">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="rounded-sheet border border-edge bg-ink/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-paper-dim">
          <ShieldCheck className="h-4 w-4 text-done" /> Sécurité & Chiffrement
        </div>
        <p className="text-xs text-dust">
          Vos clés API Steam et vos accès sont chiffrés en{" "}
          <strong>AES-256-GCM</strong>. Aucune clé n&apos;est stockée en clair.
        </p>
      </div>

      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-control border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger transition hover:bg-danger/20"
        >
          <LogOut className="h-3.5 w-3.5" /> Se déconnecter
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-control border border-seam bg-edge px-4 py-2.5 text-xs font-semibold text-paper transition hover:bg-seam"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
