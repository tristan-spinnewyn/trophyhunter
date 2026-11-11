// components/settings/SettingsModal.tsx
"use client";

import { Check, AlertCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import type { SettingsModalProps } from "./SettingsModal.types";
import { useSettingsModalState } from "./useSettingsModalState";
import { SteamSettingsSection } from "./SteamSettingsSection";
import { MobileInstallGuide } from "./MobileInstallGuide";
import { BackupSection } from "./BackupSection";
import { UserSettingsSections } from "./UserSettingsSections";

export default function SettingsModal(props: SettingsModalProps) {
  const { isOpen, onClose } = props;
  const state = useSettingsModalState(props);

  if (!isOpen) return null;

  return (
    <Modal title="Paramètres & sauvegarde" onClose={onClose}>
      {state.statusMsg && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-control p-3 text-sm ${
            state.statusMsg.type === "success"
              ? "bg-done/10 text-done border border-done/20"
              : "bg-danger/10 text-danger border border-danger/20"
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

        <UserSettingsSections />

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
