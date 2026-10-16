import { useState } from "react";
import type {
  PlatformType,
  PlatformAccount,
  UserAccountProfile,
} from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";

interface UsePlatformModalProps {
  accountProfile: UserAccountProfile;
  onAccountChange: (profile: UserAccountProfile) => void;
  onSteamUserChange: (steamUser: string) => void;
  setSteamInput: (val: string) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (account: PlatformAccount) => Promise<void>;
  removeAccountFromSQLite: (platform: PlatformType) => Promise<void>;
  handleConnectAndSyncSteam: (targetUser?: string) => Promise<void>;
}

export function usePlatformModal({
  accountProfile,
  onAccountChange,
  onSteamUserChange,
  setSteamInput,
  setBannerMsg,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  removeAccountFromSQLite,
  handleConnectAndSyncSteam,
}: UsePlatformModalProps) {
  const [editingPlatform, setEditingPlatform] = useState<PlatformType | null>(
    null
  );
  const [platForm, setPlatForm] = useState({
    username: "",
    displayName: "",
    level: "",
    gamesOwned: "",
    totalAchievements: "",
    completedGames: "",
    hoursPlayed: "",
    gamerScore: "",
    platinum: "",
    gold: "",
    silver: "",
    bronze: "",
  });

  const openEditPlatform = (platform: PlatformType) => {
    const existing = accountProfile.accounts[platform];
    setEditingPlatform(platform);
    setPlatForm({
      username: existing?.username || "",
      displayName: existing?.displayName || existing?.username || "",
      level: existing?.level ? String(existing.level) : "",
      gamesOwned: existing?.stats.gamesOwned
        ? String(existing.stats.gamesOwned)
        : "",
      totalAchievements: existing?.stats.totalAchievements
        ? String(existing.stats.totalAchievements)
        : "",
      completedGames: existing?.stats.completedGames
        ? String(existing.stats.completedGames)
        : "",
      hoursPlayed: existing?.stats.hoursPlayed
        ? String(existing.stats.hoursPlayed)
        : "",
      gamerScore: existing?.stats.gamerScore
        ? String(existing.stats.gamerScore)
        : "",
      platinum: existing?.stats.trophies?.platinum
        ? String(existing.stats.trophies.platinum)
        : "",
      gold: existing?.stats.trophies?.gold
        ? String(existing.stats.trophies.gold)
        : "",
      silver: existing?.stats.trophies?.silver
        ? String(existing.stats.trophies.silver)
        : "",
      bronze: existing?.stats.trophies?.bronze
        ? String(existing.stats.trophies.bronze)
        : "",
    });
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
    const platCount = parseInt(platForm.platinum, 10) || 0;
    const goldCount = parseInt(platForm.gold, 10) || 0;
    const silverCount = parseInt(platForm.silver, 10) || 0;
    const bronzeCount = parseInt(platForm.bronze, 10) || 0;
    const sumTrophies = platCount + goldCount + silverCount + bronzeCount;

    const totalAch =
      parseInt(platForm.totalAchievements, 10) || sumTrophies || 0;
    const completed = parseInt(platForm.completedGames, 10) || platCount || 0;

    const newAcc: PlatformAccount = {
      platform: editingPlatform,
      username: platForm.username.trim(),
      displayName: platForm.displayName.trim() || platForm.username.trim(),
      level: parseInt(platForm.level, 10) || undefined,
      connectedAt: existing?.connectedAt || new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      stats: {
        gamesOwned: parseInt(platForm.gamesOwned, 10) || 0,
        totalAchievements: totalAch,
        completedGames: completed,
        hoursPlayed: parseFloat(platForm.hoursPlayed) || undefined,
        gamerScore: parseInt(platForm.gamerScore, 10) || undefined,
        trophies:
          editingPlatform === "epic"
            ? {
                platinum: platCount,
                gold: goldCount,
                silver: silverCount,
                bronze: bronzeCount,
              }
            : undefined,
      },
    };

    updateAccountProfileInMemory(newAcc);
    await persistAccountToSQLite(newAcc);
    setEditingPlatform(null);
    setBannerMsg({
      type: "success",
      text: `Compte ${PLATFORM_META[editingPlatform].name} enregistré dans SQLite avec succès !`,
    });
  };

  const handleDisconnectPlatform = async (platform: PlatformType) => {
    const nextAccounts = { ...accountProfile.accounts };
    delete nextAccounts[platform];
    onAccountChange({
      ...accountProfile,
      accounts: nextAccounts,
    });
    await removeAccountFromSQLite(platform);
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
