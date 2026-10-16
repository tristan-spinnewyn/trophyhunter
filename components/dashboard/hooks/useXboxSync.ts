import { useState } from "react";
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";

interface UseXboxSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  xboxInput: string;
  xboxApiKey: string;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (
    account: PlatformAccount,
    plainApiKey?: string
  ) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
}

export function useXboxSync({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  xboxInput,
  xboxApiKey,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
}: UseXboxSyncProps) {
  const [isSyncingXbox, setIsSyncingXbox] = useState(false);

  const handleConnectAndSyncXbox = async (overrideUser?: string) => {
    const targetUser = (overrideUser || xboxInput).trim();
    if (!targetUser) return;
    setIsSyncingXbox(true);
    setBannerMsg(null);
    try {
      const keyParam = xboxApiKey
        ? `&key=${encodeURIComponent(xboxApiKey)}`
        : "";
      const res = await fetch(
        `/api/profile/xbox?user=${encodeURIComponent(targetUser)}${keyParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de synchroniser avec Xbox.");
      }
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(
        data.account,
        xboxApiKey.trim() || undefined
      );
      if (
        Array.isArray(data.discoveredGames) &&
        data.discoveredGames.length > 0
      ) {
        const merged = mergeGamesList(ownedGames, data.discoveredGames);
        onOwnedGamesChange(merged);
        await persistGamesToSQLite(data.discoveredGames);
      }
      setBannerMsg({
        type: "success",
        text:
          data.notice ||
          `Compte Xbox Live "${data.account.displayName}" synchronisé (${data.discoveredGames?.length || 0} jeux découverts) !`,
      });
    } catch (err: any) {
      setBannerMsg({
        type: "error",
        text: err.message || "Erreur de connexion Xbox Live.",
      });
    } finally {
      setIsSyncingXbox(false);
    }
  };

  return {
    isSyncingXbox,
    handleConnectAndSyncXbox,
  };
}
