// components/settings/useUserSettings.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSettings } from "@/lib/types";

export interface UserSettingsState {
  /** Null until loaded, and for a signed-out visitor. */
  readonly settings: UserSettings | null;
  readonly saveError: string | null;
  readonly update: (changes: Partial<UserSettings>) => Promise<void>;
}

/** Loads the signed-in user's settings and saves changes, keeping the previous value when a save fails. */
export function useUserSettings(): UserSettingsState {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/user/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: UserSettings } | null) => {
        if (isCurrent) setSettings(data?.settings ?? null);
      })
      .catch(() => {
        if (isCurrent) setSettings(null);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const update = useCallback(async (changes: Partial<UserSettings>) => {
    setSaveError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { settings: UserSettings };
      setSettings(data.settings);
    } catch {
      setSaveError("Impossible d'enregistrer ce réglage.");
    }
  }, []);

  return { settings, saveError, update };
}
