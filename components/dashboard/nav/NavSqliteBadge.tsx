// components/dashboard/nav/NavSqliteBadge.tsx

import { ShieldCheck, Database } from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface NavSqliteBadgeProps {
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
}

export function NavSqliteBadge({
  currentUser,
  onOpenAuthModal,
}: NavSqliteBadgeProps) {
  return (
    <div className="ml-auto flex items-center gap-1.5 pl-2 shrink-0">
      {currentUser ? (
        <button
          onClick={onOpenAuthModal}
          title="Session SQLite active • Clés API chiffrées AES-256-GCM"
          className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>SQLite : @{currentUser.username}</span>
        </button>
      ) : (
        <button
          onClick={onOpenAuthModal}
          title="Activer la base SQLite pour sécuriser vos clés API et synchroniser vos données"
          className="flex items-center gap-1.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20"
        >
          <Database className="h-3.5 w-3.5 text-sky-400" />
          <span>Base SQLite (Sécurisée)</span>
        </button>
      )}
    </div>
  );
}
