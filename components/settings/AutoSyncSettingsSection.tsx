// components/settings/AutoSyncSettingsSection.tsx
"use client";

import { RefreshCw } from "lucide-react";
import { AUTO_SYNC_HOUR_CHOICES } from "@/lib/settings/user-settings-input";
import { useUserSettings } from "./useUserSettings";

const OFF = "off";

/** Lets the signed-in owner have the server sync every connected platform on its own. */
export function AutoSyncSettingsSection() {
  const { settings, saveError, update } = useUserSettings();
  if (!settings) return null;

  const value = settings.autoSyncHours === null ? OFF : String(settings.autoSyncHours);

  return (
    <div className="rounded-sheet border border-edge bg-plank p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-paper">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Synchronisation automatique
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="auto-sync-hours" className="text-xs text-paper-dim">
          Synchroniser mes plateformes
        </label>
        <select
          id="auto-sync-hours"
          value={value}
          onChange={(e) => void update({ autoSyncHours: e.target.value === OFF ? null : Number(e.target.value) })}
          className="rounded-control border border-seam bg-ink px-3 py-1.5 text-xs text-paper outline-none focus:border-lamp"
        >
          <option value={OFF}>Jamais</option>
          {AUTO_SYNC_HOUR_CHOICES.map((hours) => (
            <option key={hours} value={String(hours)}>
              Toutes les {hours} h
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-[11px] text-dust">
        {settings.autoSyncHours === null
          ? "Tes jeux ne se mettent à jour que quand tu lances une synchronisation."
          : `Le serveur met à jour tes comptes toutes les ${settings.autoSyncHours} h avec les clés enregistrées, même app fermée. Epic Games a besoin d'une connexion récente.`}
      </p>
      {saveError && <p className="mt-2 text-[11px] text-danger">{saveError}</p>}
    </div>
  );
}
