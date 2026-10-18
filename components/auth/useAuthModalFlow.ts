// components/auth/useAuthModalFlow.ts
"use client";

import { useState } from "react";
import type { User as UserType } from "@/lib/types";

interface FlowProps {
  readonly onAuthSuccess: (user: UserType) => void;
  readonly onLogout: () => void;
  readonly onClose: () => void;
}

export function useAuthModalFlow({ onAuthSuccess, onLogout, onClose }: FlowProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: Record<string, string> = { username: username.trim(), password };
      if (mode === "register" && displayName.trim()) {
        payload.displayName = displayName.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");

      setSuccessMsg(
        mode === "register"
          ? "Compte créé avec succès ! Session active."
          : "Connexion réussie !"
      );
      onAuthSuccess(data.user);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'opération.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onLogout();
      setSuccessMsg("Déconnexion réussie.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      setErrorMsg("Erreur lors de la déconnexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode,
    setMode,
    username,
    setUsername,
    password,
    setPassword,
    displayName,
    setDisplayName,
    isLoading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    handleSubmit,
    handleLogout,
  };
}
