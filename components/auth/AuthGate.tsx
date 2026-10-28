// components/auth/AuthGate.tsx
"use client";

import { useState, useEffect } from "react";
import type { User as UserType } from "@/lib/types";
import { AuthGateHeader } from "./AuthGateHeader";
import { AuthGateForm } from "./AuthGateForm";

interface AuthGateProps {
  onAuthSuccess: (user: UserType) => void;
}

export default function AuthGate({ onAuthSuccess }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [legacyGamesCount, setLegacyGamesCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawGames = localStorage.getItem("trophyhunter_owned_games");
        const games = rawGames ? JSON.parse(rawGames) : [];
        if (Array.isArray(games) && games.length > 0) {
          setLegacyGamesCount(games.length);
          setMode("register");
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: Record<string, string> = { username: username.trim(), password };
      if (mode === "register" && displayName.trim()) payload.displayName = displayName.trim();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");

      setSuccessMsg(mode === "register" ? "Compte créé avec succès ! Chargement de votre espace..." : "Connexion réussie ! Chargement de votre espace...");
      setTimeout(() => { onAuthSuccess(data.user); }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-4 max-w-xl mx-auto w-full space-y-8">
      <AuthGateHeader legacyGamesCount={legacyGamesCount} />

      <AuthGateForm
        mode={mode} setMode={setMode} username={username} setUsername={setUsername}
        password={password} setPassword={setPassword} displayName={displayName}
        setDisplayName={setDisplayName} isLoading={isLoading} errorMsg={errorMsg}
        successMsg={successMsg} onSubmit={handleSubmit}
      />
    </div>
  );
}
