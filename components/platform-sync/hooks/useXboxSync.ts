// components/platform-sync/hooks/useXboxSync.ts

import { useState } from "react";
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { mergeGamesList } from "@/lib/library/game-list";
import { postProfileSync } from "@/lib/accounts/profile-sync-client";

interface UseXboxSyncProps {
  readonly ownedGames: OwnedGame[];
  readonly onOwnedGamesChange: (games: OwnedGame[]) => void;
  readonly setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  readonly xboxInput: string;
  readonly xboxApiKey: string;
  readonly updateAccountProfileInMemory: (account: PlatformAccount) => void;
  readonly persistAccount: (
    account: PlatformAccount,
    plainApiKey?: string
  ) => Promise<void>;
  readonly persistGames: (games: OwnedGame[]) => Promise<void>;
}

interface XboxSyncApiResponse {
  readonly success?: boolean;
  readonly error?: string;
  readonly notice?: string;
  readonly account?: PlatformAccount;
  readonly discoveredGames?: OwnedGame[];
}

export function useXboxSync({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  xboxInput,
  xboxApiKey,
  updateAccountProfileInMemory,
  persistAccount,
  persistGames,
}: UseXboxSyncProps) {
  const [isSyncingXbox, setIsSyncingXbox] = useState(false);

  const handleConnectAndSyncXbox = async (overrideUser?: string | unknown) => {
    const rawTarget = typeof overrideUser === "string" ? overrideUser : xboxInput;
    const targetUser = (rawTarget || "").trim();
    if (!targetUser) return;
    setIsSyncingXbox(true);
    setBannerMsg(null);
    try {
      const trimmedKey = xboxApiKey.trim();
      const res = await postProfileSync("xbox", { user: targetUser, secret: trimmedKey || undefined });
      const data = (await res.json()) as XboxSyncApiResponse;
      if (!res.ok || !data.success || !data.account) {
        throw new Error(data.error || "Impossible de synchroniser avec Xbox.");
      }
      updateAccountProfileInMemory(data.account);
      await persistAccount(data.account, trimmedKey || undefined);
      const discovered = Array.isArray(data.discoveredGames) ? data.discoveredGames : [];
      if (discovered.length > 0) {
        const merged = mergeGamesList(ownedGames, discovered);
        onOwnedGamesChange(merged);
        await persistGames(discovered);
      }
      setBannerMsg({
        type: "success",
        text:
          data.notice ||
          `Compte Xbox Live "${data.account.displayName}" synchronisé (${discovered.length} jeux découverts) !`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur de connexion Xbox Live.";
      setBannerMsg({
        type: "error",
        text: message,
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
