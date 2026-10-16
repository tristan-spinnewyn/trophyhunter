"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseEpicAuthInput } from "@/lib/epic/auth-parser";

interface EpicAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (token: string) => Promise<void> | void;
  gameName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export const EPIC_AUTH_URL =
  "https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code";

export default function EpicAuthModal({
  isOpen,
  onClose,
  onSubmit,
  gameName,
  isLoading = false,
  error = null,
}: EpicAuthModalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [extractedCode, setExtractedCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTokenInput("");
      setExtractedCode("");
      setLocalError(null);
    }
  }, [isOpen]);

  const handleInputChange = (val: string) => {
    setTokenInput(val);
    setLocalError(null);
    const parsed = parseEpicAuthInput(val);
    setExtractedCode(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parseEpicAuthInput(tokenInput);
    if (!clean) {
      setLocalError("Veuillez saisir votre authorizationCode ou coller le JSON retourné par Epic.");
      return;
    }
    await onSubmit(clean);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/40 bg-slate-900 p-6 sm:p-7 shadow-2xl shadow-purple-950/40 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Autorisation Epic Games
              </h3>
              <p className="text-xs text-purple-300 font-medium truncate max-w-[280px] sm:max-w-[360px]">
                {gameName
                  ? `Synchronisation des succès de "${gameName}"`
                  : "Connexion et récupération des trophées Epic"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-4 space-y-3 text-xs">
          <p className="font-semibold text-purple-200">
            Pour synchroniser vos succès officiels avec Epic Games :
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
            <li>
              Ouvrez la page officielle d&apos;autorisation Epic Games en un clic :
            </li>
            <li className="list-none pl-4 pt-1">
              <a
                href={EPIC_AUTH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/30 border border-purple-500/50 px-3 py-1.5 font-bold text-purple-200 hover:bg-purple-600/50 hover:text-white transition shadow-sm"
              >
                <span>Ouvrir la page d&apos;autorisation Epic</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li className="pt-1">
              Connectez-vous sur <span className="font-mono text-purple-300">epicgames.com</span> si demandé.
            </li>
            <li>
              Copiez tout le texte JSON affiché (ou la valeur de <span className="font-mono text-purple-300">&quot;authorizationCode&quot;</span>) et collez-le ci-dessous.
            </li>
          </ol>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Code d&apos;échange ou JSON Epic :</span>
              {extractedCode && extractedCode !== tokenInput && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Code extrait automatiquement
                </span>
              )}
            </label>
            <textarea
              value={tokenInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='Collez ici : {"redirectUrl":"...","authorizationCode":"..."}'
              rows={3}
              disabled={isLoading}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono transition resize-none disabled:opacity-50"
              autoFocus
            />
          </div>

          {(error || localError) && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error || localError}</span>
            </div>
          )}

          {/* Actions */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
