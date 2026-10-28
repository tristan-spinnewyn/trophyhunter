// components/epic-auth/EpicAuthForm.tsx
"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface FormProps {
  tokenInput: string;
  extractedCode: string;
  isLoading: boolean;
  error?: string | null;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function EpicAuthForm({
  tokenInput,
  extractedCode,
  isLoading,
  error,
  onInputChange,
  onSubmit,
  onClose,
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Code d&apos;échange ou JSON Epic :</span>
          {extractedCode && extractedCode !== tokenInput && (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Code extrait automatiquement
            </span>
          )}
        </label>
        <textarea
          value={tokenInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder='Collez ici : {"redirectUrl":"...","authorizationCode":"..."}'
          rows={3}
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono transition resize-none disabled:opacity-50"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || !tokenInput.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2 text-xs font-bold text-white hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Synchronisation...</span>
            </>
          ) : (
            <span>Synchroniser les succès</span>
          )}
        </button>
      </div>
    </form>
  );
}
