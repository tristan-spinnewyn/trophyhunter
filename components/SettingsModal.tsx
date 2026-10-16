// components/SettingsModal.tsx
"use client";

import { X, Check, AlertCircle } from "lucide-react";
import type { SettingsModalProps } from "./settings/SettingsModal.types";
import { useSettingsModalState } from "./settings/useSettingsModalState";
import { SteamSettingsSection } from "./settings/SteamSettingsSection";
import { MobileInstallGuide } from "./settings/MobileInstallGuide";
import { BackupSection } from "./settings/BackupSection";

export default function SettingsModal(props: SettingsModalProps) {
  const { isOpen, onClose } = props;
  const state = useSettingsModalState(props);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Paramètres & Sauvegarde
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {state.statusMsg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs ${
              state.statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {state.statusMsg.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{state.statusMsg.text}</span>
          </div>
        )}

        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <SteamSettingsSection
            steamUser={state.steamUser}
            setSteamUser={state.setSteamUser}
            steamApiKey={state.steamApiKey}
            setSteamApiKey={state.setSteamApiKey}
            steamSaved={state.steamSaved}
            onSaveSteamUser={state.handleSaveSteamUser}
          />

          <MobileInstallGuide />

          <BackupSection
            copied={state.copied}
            importText={state.importText}
            setImportText={state.setImportText}
            onExport={state.handleExport}
            onDownload={state.handleDownload}
            onImport={state.handleImport}
            onClearAll={state.handleClearAll}
          />
        </div>
      </div>
    </div>
  );
}
