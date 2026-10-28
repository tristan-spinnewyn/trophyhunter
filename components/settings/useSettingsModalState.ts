// components/settings/useSettingsModalState.ts
"use client";

import { useState, useEffect } from "react";
import type { SettingsModalProps, StatusMsg } from "./SettingsModal.types";
import { fetchExportJson, parseSyncPayload, saveSteamAccountApi } from "./settingsBackupUtils";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

export function useSettingsModalState(props: SettingsModalProps) {
  const { isOpen, initialSteamUser = "", initialSteamApiKey = "", onSteamUserSaved, onRefreshData, onDataReset } = props;
  const confirm = useConfirm();
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [steamUser, setSteamUser] = useState(initialSteamUser);
  const [steamApiKey, setSteamApiKey] = useState(initialSteamApiKey);
  const [steamSaved, setSteamSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState<StatusMsg | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSteamUser(initialSteamUser || "");
      setSteamApiKey(initialSteamApiKey || "");
    }
  }, [isOpen, initialSteamUser, initialSteamApiKey]);

  const handleSaveSteamUser = async () => {
    try {
      const trimmedUser = steamUser.trim();
      const trimmedKey = steamApiKey.trim();
      if (trimmedUser) await saveSteamAccountApi(trimmedUser, trimmedKey);
      setSteamSaved(true);
      if (onSteamUserSaved) onSteamUserSaved(trimmedUser, trimmedKey);
      if (onRefreshData) await onRefreshData();
      setStatusMsg({ type: "success", text: "Paramètres Steam enregistrés dans SQLite !" });
      setTimeout(() => setSteamSaved(false), 2500);
    } catch {
      setStatusMsg({ type: "error", text: "Erreur lors de la sauvegarde dans SQLite." });
    }
  };

  const handleExport = async () => {
    try {
      const data = await fetchExportJson();
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setStatusMsg({ type: "success", text: "Données SQLite copiées dans le presse-papier !" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setStatusMsg({ type: "error", text: "Impossible d'exporter les données SQLite." });
    }
  };

  const handleDownload = async () => {
    try {
      const data = await fetchExportJson();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trophyhunter-sauvegarde-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: "success", text: "Fichier de sauvegarde SQLite téléchargé !" });
    } catch {
      setStatusMsg({ type: "error", text: "Impossible de télécharger la sauvegarde." });
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    try {
      const syncPayload = parseSyncPayload(importText);
      const res = await fetch("/api/user/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(syncPayload) });
      if (!res.ok) throw new Error("Sync failed");
      if (onRefreshData) await onRefreshData();
      setImportText("");
      setStatusMsg({ type: "success", text: "Données importées dans la base SQLite avec succès !" });
    } catch {
      setStatusMsg({ type: "error", text: "Format JSON invalide. Vérifiez vos données." });
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: "Tout supprimer ?",
      message: "Ta collection, ta progression et tes notes seront définitivement effacées. Cette action est irréversible.",
      confirmLabel: "Tout supprimer",
    });
    if (confirmed) {
      try {
        await fetch("/api/user/games?all=true", { method: "DELETE" });
        onDataReset();
        setStatusMsg({ type: "success", text: "Toutes les données SQLite ont été réinitialisées." });
      } catch {
        setStatusMsg({ type: "error", text: "Erreur lors de la réinitialisation." });
      }
    }
  };

  return {
    steamUser, setSteamUser, steamApiKey, setSteamApiKey, steamSaved,
    statusMsg, copied, importText, setImportText,
    handleSaveSteamUser, handleExport, handleDownload, handleImport, handleClearAll,
  };
}
