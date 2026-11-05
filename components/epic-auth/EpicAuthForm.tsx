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
        <label className="text-xs font-semibold text-paper-dim flex items-center justify-between">
          <span>Code d&apos;échange ou JSON Epic :</span>
          {extractedCode && extractedCode !== tokenInput && (
            <span className="text-[11px] text-done font-medium flex items-center gap-1">
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
          className="w-full rounded-sheet border border-seam bg-ink p-3 text-xs text-paper placeholder-faint outline-none focus:border-platinum font-mono transition resize-none disabled:opacity-50"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/30 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-edge">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-control border border-seam px-4 py-2 text-xs font-medium text-paper-dim hover:bg-edge hover:text-paper transition disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || !tokenInput.trim()}
          className="inline-flex items-center gap-2 rounded-control bg-lamp px-5 py-2 text-sm font-bold text-ink hover:bg-lamp-bright transition disabled:opacity-50 disabled:cursor-not-allowed"
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
