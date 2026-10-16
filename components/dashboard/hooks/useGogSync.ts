import { useState } from "react";
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { mergeGamesList } from "@/components/dashboard/utils";

interface UseGogSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  gogInput: string;
  gogToken: string;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (
    account: PlatformAccount,
    plainApiKey?: string
  ) => Promise<void>;
  persistGamesToSQLite: (games: OwnedGame[]) => Promise<void>;
}

export function useGogSync({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  gogInput,
  gogToken,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
}: UseGogSyncProps) {
  const [isSyncingGOG, setIsSyncingGOG] = useState(false);

  const handleConnectAndSyncGOG = async (overrideUser?: string | unknown) => {
    const rawTarget = typeof overrideUser === "string" ? overrideUser : gogInput;
    const targetUser = (rawTarget || "").trim();
    if (!targetUser) return;
    setIsSyncingGOG(true);
    setBannerMsg(null);
    try {
      const tokenParam = gogToken
        ? `&token=${encodeURIComponent(gogToken)}`
        : "";
      const res = await fetch(
        `/api/profile/gog?user=${encodeURIComponent(targetUser)}${tokenParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de joindre GOG.");
      }
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(
        data.account,
        gogToken.trim() || undefined
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
        text: `Compte GOG "${data.account.displayName}" connecté (${data.discoveredGames?.length || 0} jeux synchronisés) !`,
      });
    } catch (err: any) {
      setBannerMsg({
        type: "error",
        text: err.message || "Erreur de connexion GOG.",
      });
    } finally {
      setIsSyncingGOG(false);
    }
  };

  return {
    isSyncingGOG,
    handleConnectAndSyncGOG,
  };
}
