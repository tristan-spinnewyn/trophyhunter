// components/platform-sync/hooks/usePlatformModal.ts

import { useState } from "react";
import type { PlatformType } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import type { UsePlatformModalProps } from "./usePlatformModal.types";
import {
  INITIAL_PLATFORM_FORM,
  createFormFromAccount,
  buildAccountFromForm,
} from "@/lib/platform-account-form";
import type { PlatformFormData } from "@/lib/platform-account-form";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

export function usePlatformModal({
  accountProfile,
  onAccountChange,
  onSteamUserChange,
  setSteamInput,
  setBannerMsg,
  updateAccountProfileInMemory,
  persistAccount,
  removeAccount,
  handleConnectAndSyncSteam,
}: UsePlatformModalProps) {
  const confirm = useConfirm();
  const [editingPlatform, setEditingPlatform] = useState<PlatformType | null>(null);
  const [platForm, setPlatForm] = useState<PlatformFormData>(INITIAL_PLATFORM_FORM);

  const openEditPlatform = (platform: PlatformType) => {
    setEditingPlatform(platform);
    setPlatForm(createFormFromAccount(accountProfile.accounts[platform]));
  };

  const handleSavePlatformModal = async () => {
    if (!editingPlatform || !platForm.username.trim()) return;

    if (editingPlatform === "steam") {
      setSteamInput(platForm.username.trim());
      setEditingPlatform(null);
      handleConnectAndSyncSteam(platForm.username.trim());
      return;
    }

    const existing = accountProfile.accounts[editingPlatform];
    const newAcc = buildAccountFromForm(editingPlatform, platForm, existing);

    updateAccountProfileInMemory(newAcc);
    await persistAccount(newAcc);
    setEditingPlatform(null);
    setBannerMsg({
      type: "success",
      text: `Compte ${PLATFORM_META[editingPlatform].name} enregistré dans SQLite avec succès !`,
    });
  };

  const handleDisconnectPlatform = async (platform: PlatformType) => {
    const confirmed = await confirm({
      title: `Délier ton compte ${PLATFORM_META[platform].name} ?`,
      message: "Les identifiants enregistrés seront supprimés. Tes jeux restent dans ta collection.",
      confirmLabel: "Délier",
    });
    if (!confirmed) return;

    const nextAccounts = { ...accountProfile.accounts };
    delete nextAccounts[platform];
    onAccountChange({
      ...accountProfile,
      accounts: nextAccounts,
    });
    await removeAccount(platform);
    if (platform === "steam") {
      onSteamUserChange("");
    }
  };

  return {
    editingPlatform,
    setEditingPlatform,
    platForm,
    setPlatForm,
    openEditPlatform,
    handleSavePlatformModal,
    handleDisconnectPlatform,
  };
}
