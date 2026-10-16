// components/dashboard/hooks/useEpicProfileConnect.ts

import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { replacePlatformInList } from "@/components/dashboard/utils";
import { parseEpicAuthInput } from "@/lib/epic/auth-parser";

interface UseEpicProfileConnectProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  setSyncProgressText: (text: string | null) => void;
  setIsSyncingEpic: (val: boolean) => void;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (account: PlatformAccount) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[], replacePlatform?: "epic") => Promise<void>;
  enrichEpicGamesAchievements: (epicGamesList: OwnedGame[], allCurrentGames: OwnedGame[]) => Promise<OwnedGame[]>;
  onRequireToken?: () => void;
}

export function useEpicProfileConnect({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  setSyncProgressText,
  setIsSyncingEpic,
  epicInput,
  epicCode,
  setEpicCode,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
  enrichEpicGamesAchievements,
  onRequireToken,
}: UseEpicProfileConnectProps) {
  const handleConnectAndSyncEpic = async (overrideUser?: string | unknown, codeOverride?: string) => {
    const rawTarget = typeof overrideUser === "string" ? overrideUser : epicInput;
    const targetUser = (rawTarget || "").trim();
    const cleanCode = parseEpicAuthInput(codeOverride || epicCode);

    if (!targetUser && !cleanCode) {
      if (onRequireToken) onRequireToken();
      return;
    }
    setIsSyncingEpic(true);
    setBannerMsg(null);
    setSyncProgressText("Importation de la bibliothèque Epic Games...");
    try {
      const userParam = targetUser ? `user=${encodeURIComponent(targetUser)}` : "";
      const codeParam = cleanCode ? `authorizationToken=${encodeURIComponent(cleanCode)}&code=${encodeURIComponent(cleanCode)}` : "";
      const query = [userParam, codeParam, "resolveAchievements=1"].filter(Boolean).join("&");
      const res = await fetch(`/api/profile/epic?${query}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data?.requiresToken && onRequireToken) {
          onRequireToken();
          return;
        }
        throw new Error(data.error || "Impossible de synchroniser avec Epic Games.");
      }

      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(data.account);

      let currentMerged = ownedGames;
      if (Array.isArray(data.discoveredGames) && data.discoveredGames.length > 0) {
        currentMerged = replacePlatformInList(ownedGames, "epic", data.discoveredGames);
        onOwnedGamesChange(currentMerged);
        await persistGamesToSQLite(currentMerged.filter((g) => g.platform === "epic"), "epic");
        currentMerged = await enrichEpicGamesAchievements(currentMerged.filter((g) => g.platform === "epic"), currentMerged);
      }

      const epicWithAch = currentMerged.filter((g) => g.platform === "epic" && (g.totalAchievements || 0) > 0).length;
      setBannerMsg({
        type: "success",
        text: data.notice || `Compte Epic Games "${data.account.displayName}" synchronisé avec succès (${data.discoveredGames?.length || 0} jeux importés, dont ${epicWithAch} avec succès détectés) !`,
      });
      setEpicCode("");
    } catch (err: any) {
      setBannerMsg({ type: "error", text: err.message || "Erreur de connexion Epic Games." });
    } finally {
      setIsSyncingEpic(false);
      setSyncProgressText(null);
    }
  };

  return { handleConnectAndSyncEpic };
}
