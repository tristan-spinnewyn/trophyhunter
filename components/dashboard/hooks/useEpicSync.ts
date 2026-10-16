import { useState, useRef, useEffect } from "react";
import type { OwnedGame, PlatformAccount } from "@/lib/types";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";
import {
  mergeGamesList,
  replacePlatformInList,
} from "@/components/dashboard/utils";

interface UseEpicSyncProps {
  ownedGames: OwnedGame[];
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  setBannerMsg: (
    msg: { type: "success" | "error"; text: string } | null
  ) => void;
  setSyncProgressText: (text: string | null) => void;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  updateAccountProfileInMemory: (account: PlatformAccount) => void;
  persistAccountToSQLite: (account: PlatformAccount) => Promise<void>;
  persistGamesToSQLite: (
    games: OwnedGame[],
    replacePlatform?: "epic"
  ) => Promise<void>;
}

export function useEpicSync({
  ownedGames,
  onOwnedGamesChange,
  setBannerMsg,
  setSyncProgressText,
  epicInput,
  epicCode,
  setEpicCode,
  updateAccountProfileInMemory,
  persistAccountToSQLite,
  persistGamesToSQLite,
}: UseEpicSyncProps) {
  const [isSyncingEpic, setIsSyncingEpic] = useState(false);
  const hasAutoEnrichedEpicRef = useRef(false);

  const enrichEpicGamesAchievements = async (
    epicGamesList: OwnedGame[],
    allCurrentGames: OwnedGame[]
  ): Promise<OwnedGame[]> => {
    const gamesToResolve = epicGamesList.filter(
      (g) =>
        g.platform === "epic" &&
        (g.totalAchievements || 0) === 0 &&
        g.name &&
        !g.name.startsWith("Epic Game (") &&
        !g.name.startsWith("Jeu Epic (")
    );

    if (gamesToResolve.length === 0) {
      return allCurrentGames;
    }

    setIsSyncingEpic(true);
    let workingGames = [...allCurrentGames];
    const BATCH_SIZE = 5;

    try {
      for (let i = 0; i < gamesToResolve.length; i += BATCH_SIZE) {
        const batch = gamesToResolve.slice(i, i + BATCH_SIZE);
        setSyncProgressText(
          `Détection des succès Epic Games (${i + 1}/${gamesToResolve.length})...`
        );

        const resolvedBatch = await Promise.all(
          batch.map(async (g) => {
            try {
              const r = await fetch(
                `/api/game/${g.appId}?name=${encodeURIComponent(
                  g.name
                )}&platform=epic&fast=1`
              );
              if (!r.ok) return g;
              const details = await r.json();
              const resolvedTotal = details?.totalAchievements || 0;
              const resolvedHeader = !isUnsplashPlaceholder(g.headerImg)
                ? g.headerImg
                : details?.headerImg || g.headerImg;
              if (resolvedTotal > 0 || resolvedHeader !== g.headerImg) {
                return {
                  ...g,
                  totalAchievements: resolvedTotal,
                  headerImg: resolvedHeader,
                };
              }
              return g;
            } catch {
              return g;
            }
          })
        );

        workingGames = mergeGamesList(workingGames, resolvedBatch);
        onOwnedGamesChange(workingGames);
        await persistGamesToSQLite(resolvedBatch);
      }
    } finally {
      setSyncProgressText(null);
      setIsSyncingEpic(false);
    }

    return workingGames;
  };

  useEffect(() => {
    if (hasAutoEnrichedEpicRef.current || isSyncingEpic) return;
    const epicGames = ownedGames.filter((g) => g.platform === "epic");
    if (
      epicGames.length > 0 &&
      epicGames.every((g) => (g.totalAchievements || 0) === 0)
    ) {
      hasAutoEnrichedEpicRef.current = true;
      enrichEpicGamesAchievements(epicGames, ownedGames).then((finalList) => {
        const withAch = finalList.filter(
          (g) => g.platform === "epic" && (g.totalAchievements || 0) > 0
        ).length;
        if (withAch > 0) {
          setBannerMsg({
            type: "success",
            text: `Succès Epic Games détectés et enregistrés dans SQLite pour ${withAch} jeu(x) !`,
          });
        }
      });
    }
  }, [ownedGames]);

  const handleConnectAndSyncEpic = async (overrideUser?: string | unknown) => {
    const rawTarget = typeof overrideUser === "string" ? overrideUser : epicInput;
    const targetUser = (rawTarget || "").trim();
    let cleanCode = (epicCode || "").trim();
    if (cleanCode.startsWith("{")) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = (
          parsed.authorizationCode ||
          parsed.authorizationToken ||
          parsed.code ||
          parsed.token ||
          cleanCode
        ).trim();
      } catch {}
    }

    if (!targetUser && !cleanCode) return;
    setIsSyncingEpic(true);
    setBannerMsg(null);
    setSyncProgressText("Importation de la bibliothèque Epic Games...");
    try {
      const userParam = targetUser
        ? `user=${encodeURIComponent(targetUser)}`
        : "";
      const codeParam = cleanCode
        ? `authorizationToken=${encodeURIComponent(cleanCode)}&code=${encodeURIComponent(cleanCode)}`
        : "";
      const query = [userParam, codeParam, "resolveAchievements=1"]
        .filter(Boolean)
        .join("&");
      const res = await fetch(`/api/profile/epic?${query}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de synchroniser avec Epic Games."
        );
      }

      hasAutoEnrichedEpicRef.current = true;
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(data.account);

      let currentMerged = ownedGames;
      if (
        Array.isArray(data.discoveredGames) &&
        data.discoveredGames.length > 0
      ) {
        currentMerged = replacePlatformInList(
          ownedGames,
          "epic",
          data.discoveredGames
        );
        onOwnedGamesChange(currentMerged);
        await persistGamesToSQLite(
          currentMerged.filter((g) => g.platform === "epic"),
          "epic"
        );

        const epicSubset = currentMerged.filter((g) => g.platform === "epic");
        currentMerged = await enrichEpicGamesAchievements(
          epicSubset,
          currentMerged
        );
      }

      const epicWithAch = currentMerged.filter(
        (g) => g.platform === "epic" && (g.totalAchievements || 0) > 0
      ).length;

      setBannerMsg({
        type: "success",
        text:
          data.notice ||
          `Compte Epic Games "${data.account.displayName}" synchronisé avec succès (${data.discoveredGames?.length || 0} jeux importés, dont ${epicWithAch} avec succès détectés) !`,
      });
      setEpicCode("");
    } catch (err: any) {
      setBannerMsg({
        type: "error",
        text: err.message || "Erreur de connexion Epic Games.",
      });
    } finally {
      setIsSyncingEpic(false);
      setSyncProgressText(null);
    }
  };

  const handleScanEpicAchievements = async () => {
    const epicSubset = ownedGames.filter((g) => g.platform === "epic");
    if (epicSubset.length === 0) {
      setBannerMsg({
        type: "error",
        text: "Aucun jeu Epic dans votre bibliothèque pour l'instant.",
      });
      return;
    }
    setBannerMsg({
      type: "success",
      text: `Actualisation en arrière-plan des succès pour ${epicSubset.length} jeux Epic...`,
    });
    const finalList = await enrichEpicGamesAchievements(epicSubset, ownedGames);
    const withAch = finalList.filter(
      (g) => g.platform === "epic" && (g.totalAchievements || 0) > 0
    ).length;
    setBannerMsg({
      type: "success",
      text: `Terminé ! ${withAch}/${epicSubset.length} jeux Epic disposent de succès répertoriés.`,
    });
  };

  const handleCleanEpicGames = async (
    epicNoAchCount: number,
    epicWithAchCount: number
  ) => {
    if (
      !confirm(
        `Voulez-vous masquer les ${epicNoAchCount} jeux Epic qui ne possèdent AUCUN succès pour ne garder que vos ${epicWithAchCount} jeux chassables ?`
      )
    ) {
      return;
    }
    const filtered = ownedGames.filter(
      (g) =>
        !(
          g.platform === "epic" &&
          (g.totalAchievements === 0 || !g.totalAchievements)
        )
    );
    onOwnedGamesChange(filtered);
    await persistGamesToSQLite(
      filtered.filter((g) => g.platform === "epic"),
      "epic"
    );
    setBannerMsg({
      type: "success",
      text: `Nettoyage terminé : ${epicNoAchCount} jeux sans succès ont été retirés.`,
    });
  };

  return {
    isSyncingEpic,
    enrichEpicGamesAchievements,
    handleConnectAndSyncEpic,
    handleScanEpicAchievements,
    handleCleanEpicGames,
  };
}
