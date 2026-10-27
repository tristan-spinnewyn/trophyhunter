// components/EpicAuthModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";
import { parseEpicAuthInput } from "@/lib/epic/auth-input";
import { EpicAuthInstructions, EPIC_AUTH_URL } from "./epic-modal/EpicAuthInstructions";
import { EpicAuthForm } from "./epic-modal/EpicAuthForm";

export { EPIC_AUTH_URL };

interface EpicAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (token: string) => Promise<void> | void;
  gameName?: string;
  isLoading?: boolean;
  error?: string | null;
}

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
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Autorisation Epic Games</h3>
              <p className="text-xs text-purple-300 font-medium truncate max-w-[280px] sm:max-w-[360px]">
                {gameName ? `Synchronisation des succès de "${gameName}"` : "Connexion et récupération des trophées Epic"}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50">
            ✕
          </button>
        </div>

        <EpicAuthInstructions />

        <EpicAuthForm
          tokenInput={tokenInput}
          extractedCode={extractedCode}
          isLoading={isLoading}
          error={error || localError}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
