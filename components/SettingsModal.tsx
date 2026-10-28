// components/SettingsModal.tsx
"use client";

import { Check, AlertCircle } from "lucide-react";
import { Modal } from "./ui/Modal";
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
    <Modal title="Paramètres & sauvegarde" onClose={onClose}>
      {state.statusMsg && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
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

      <div className="space-y-5">
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
    </Modal>
  );
}
