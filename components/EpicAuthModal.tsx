// components/EpicAuthModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";
import { parseEpicAuthInput } from "@/lib/epic/auth-input";
import { EpicAuthInstructions, EPIC_AUTH_URL } from "./epic-modal/EpicAuthInstructions";
import { EpicAuthForm } from "./epic-modal/EpicAuthForm";
import { Modal } from "./ui/Modal";

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
    <Modal
      title="Autorisation Epic Games"
      icon={<KeyRound className="h-4 w-4 text-purple-400" />}
      onClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-400">
          {gameName ? `Synchronisation des succès de « ${gameName} »` : "Connexion et récupération des trophées Epic"}
        </p>

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
    </Modal>
  );
}
