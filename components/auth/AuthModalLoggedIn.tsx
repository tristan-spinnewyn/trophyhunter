// components/auth/AuthModalLoggedIn.tsx

import { User, Database, ShieldCheck, Loader2, LogOut, CheckCircle2 } from "lucide-react";
import type { User as UserType } from "@/lib/types";

interface LoggedInProps {
  currentUser: UserType;
  successMsg: string | null;
  isSyncing: boolean;
  isLoading: boolean;
  onSyncLocalData?: () => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
  setIsSyncing: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
}

export function AuthModalLoggedIn({
  currentUser, successMsg, isSyncing, isLoading, onSyncLocalData,
  onLogout, onClose, setIsSyncing, setSuccessMsg, setErrorMsg,
}: LoggedInProps) {
  const handleMigrate = async () => {
    if (!onSyncLocalData) return;
    setIsSyncing(true);
    try {
      await onSyncLocalData();
      setSuccessMsg("Données locales migrées avec succès vers SQLite !");
    } catch {
      setErrorMsg("Échec de la synchronisation locale.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{currentUser.displayName || currentUser.username}</h3>
          <p className="text-xs text-slate-400">@{currentUser.username}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <Database className="h-3 w-3" /> Base de données SQLite connectée
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Sécurité & Chiffrement
        </div>
        <p className="text-xs text-slate-400">
          Vos clés API Steam et vos accès sont chiffrés en <strong>AES-256-GCM</strong>. Aucune clé n&apos;est stockée en clair.
        </p>

        {onSyncLocalData && (
          <button
            onClick={handleMigrate} disabled={isSyncing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            {isSyncing ? "Synchronisation..." : "Synchroniser mes données locales vers SQLite"}
          </button>
        )}
      </div>

      <div className="pt-2 flex gap-2">
        <button
          onClick={onLogout} disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
        >
          <LogOut className="h-3.5 w-3.5" /> Se déconnecter
        </button>
        <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700">
          Fermer
        </button>
      </div>
    </div>
  );
}
