"use client";

import { useState, useRef, useEffect } from "react";
import type {
  PlatformType,
  PlatformAccount,
  OwnedGame,
  UserAccountProfile,
  User as UserType,
} from "@/lib/types";
import { PLATFORM_META } from "@/lib/storage";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";

import { mergeGamesList } from "@/components/dashboard/utils";

function replacePlatformInList(
  base: OwnedGame[],
  platform: PlatformType,
  incoming: OwnedGame[]
): OwnedGame[] {
  const existingByPlatform = new Map<number, OwnedGame>();
  for (const g of base) {
    if (g.platform === platform) {
      existingByPlatform.set(g.appId, g);
    }
  }
  const kept = base.filter((g) => g.platform !== platform);
  const enrichedIncoming = incoming.map((g) => {
    const prev = existingByPlatform.get(g.appId);
    if (!prev) return g;
    return {
      ...g,
      totalAchievements:
        g.totalAchievements > 0 ? g.totalAchievements : prev.totalAchievements,
      unlockedCount: Math.max(g.unlockedCount || 0, prev.unlockedCount || 0),
      headerImg:
        !isUnsplashPlaceholder(g.headerImg)
          ? g.headerImg
          : prev.headerImg || g.headerImg,
    };
  });
  return mergeGamesList(kept, enrichedIncoming);
}

interface UsePlatformSyncProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
  steamInput: string;
  setSteamInput: (val: string) => void;
  steamApiKey: string;
  xboxInput: string;
  xboxApiKey: string;
  epicInput: string;
  epicCode: string;
  setEpicCode: (val: string) => void;
  gogInput: string;
  gogToken: string;
}

export function usePlatformSync({
  accountProfile,
  ownedGames,
  onAccountChange,
  onOwnedGamesChange,
  onSteamUserChange,
  currentUser,
  setBannerMsg,
  steamInput,
  setSteamInput,
  steamApiKey,
  xboxInput,
  xboxApiKey,
  epicInput,
  epicCode,
  setEpicCode,
  gogInput,
  gogToken,
}: UsePlatformSyncProps) {
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);
  const [isSyncingXbox, setIsSyncingXbox] = useState(false);
  const [isSyncingEpic, setIsSyncingEpic] = useState(false);
  const [isSyncingGOG, setIsSyncingGOG] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);

  const [editingPlatform, setEditingPlatform] = useState<PlatformType | null>(null);
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

  const hasAutoEnrichedEpicRef = useRef(false);

  const updateAccountProfileInMemory = (account: PlatformAccount): UserAccountProfile => {
    const nextProfile: UserAccountProfile = {
      ...accountProfile,
      displayName:
        accountProfile.displayName === "Chasseur de Trophées" && account.displayName
          ? account.displayName
          : accountProfile.displayName,
      avatarUrl: accountProfile.avatarUrl || account.avatarUrl,
      accounts: {
        ...accountProfile.accounts,
        [account.platform]: account,
      },
    };
    onAccountChange(nextProfile);
    return nextProfile;
  };

  const persistAccountToSQLite = async (account: PlatformAccount, plainApiKey?: string) => {
    try {
      await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, plainApiKey }),
      });
    } catch (e) {
      console.error("Failed to persist account to SQLite:", e);
    }
  };

  const persistGamesToSQLite = async (
    games: OwnedGame[],
    replacePlatform?: PlatformType
  ) => {
    if ((!games || games.length === 0) && !replacePlatform) return;
    try {
      await fetch("/api/user/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games, replacePlatform }),
      });
    } catch (e) {
      console.error("Failed to persist games to SQLite:", e);
    }
  };

  const removeAccountFromSQLite = async (platform: PlatformType) => {
    try {
      await fetch(`/api/user/account?platform=${platform}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove account from SQLite:", e);
    }
  };

  const removeGameFromSQLite = async (appId: number, platform?: PlatformType) => {
    try {
      const platParam = platform ? `&platform=${platform}` : "";
      await fetch(`/api/user/games?appId=${appId}${platParam}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to remove game from SQLite:", e);
    }
  };

  const syncSingleSteamGame = async (
    user: string,
    game: OwnedGame
  ): Promise<OwnedGame> => {
    try {
      const res = await fetch(
        `/api/sync?user=${encodeURIComponent(user)}&appId=${game.appId}`
      );
      if (!res.ok) return game;
      const data = await res.json();
      if (!data.success) return game;

      const unlockedIds: string[] = Array.isArray(data.unlockedIds)
        ? data.unlockedIds
        : [];

      const totalAch = data.totalAchievements || game.totalAchievements || 0;
      const unlockedCount = Math.max(
        data.count || 0,
        unlockedIds.length,
        game.unlockedCount || 0
      );

      if (unlockedIds.length > 0 && currentUser) {
        fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.appId,
            platform: "steam",
            progress: {
              unlockedIds,
              notes: {},
              lastPlayed: new Date().toISOString(),
            },
          }),
        }).catch(() => {});
      }

      return {
        ...game,
        name:
          game.name.startsWith("Jeu Steam #") && data.gameName
            ? data.gameName
            : game.name,
        totalAchievements: totalAch,
        unlockedCount,
      };
    } catch {
      return game;
    }
  };

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
          `Analyse des succès Epic Games (${Math.min(
            i + BATCH_SIZE,
            gamesToResolve.length
          )}/${gamesToResolve.length}) : ${batch[0].name}...`
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
              const resolvedHeader =
                !isUnsplashPlaceholder(g.headerImg)
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

  // Auto-resolve Epic Games achievements once on load
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

  const handleConnectAndSyncSteam = async (targetUser?: string) => {
    const userToSync = (targetUser ?? steamInput).trim();
    if (!userToSync) return;

    setIsSyncingSteam(true);
    setBannerMsg(null);
    setSyncProgressText("Connexion au profil Steam...");

    try {
      const keyParam = steamApiKey.trim()
        ? `&key=${encodeURIComponent(steamApiKey.trim())}`
        : "";
      const res = await fetch(
        `/api/profile/steam?user=${encodeURIComponent(userToSync)}${keyParam}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de récupérer le profil Steam."
        );
      }

      const fetchedAccount: PlatformAccount = data.account;
      const discovered: OwnedGame[] = data.discoveredGames || [];

      onSteamUserChange(fetchedAccount.username);
      updateAccountProfileInMemory(fetchedAccount);

      let mergedGames = mergeGamesList(ownedGames, discovered);
      onOwnedGamesChange(mergedGames);

      const steamGamesToSync = mergedGames.filter(
        (g) => g.platform === "steam"
      );

      let syncedAchievementsTotal = 0;
      const updatedSteamGames: OwnedGame[] = [];

      for (let i = 0; i < steamGamesToSync.length; i++) {
        const g = steamGamesToSync[i];
        setSyncProgressText(
          `Synchronisation des succès (${i + 1}/${steamGamesToSync.length}) : ${g.name}...`
        );
        const syncedGame = await syncSingleSteamGame(
          fetchedAccount.username,
          g
        );
        syncedAchievementsTotal += syncedGame.unlockedCount;
        updatedSteamGames.push(syncedGame);
      }

      mergedGames = mergeGamesList(mergedGames, updatedSteamGames);
      onOwnedGamesChange(mergedGames);

      const localCompleted = mergedGames.filter(
        (g) =>
          g.platform === "steam" &&
          g.totalAchievements > 0 &&
          g.unlockedCount >= g.totalAchievements
      ).length;

      const finalAccount: PlatformAccount = {
        ...fetchedAccount,
        stats: {
          ...fetchedAccount.stats,
          gamesOwned: Math.max(
            fetchedAccount.stats.gamesOwned,
            steamGamesToSync.length
          ),
          totalAchievements: Math.max(
            fetchedAccount.stats.totalAchievements,
            syncedAchievementsTotal
          ),
          completedGames: Math.max(
            fetchedAccount.stats.completedGames,
            localCompleted
          ),
        },
      };

      updateAccountProfileInMemory(finalAccount);
      await persistAccountToSQLite(finalAccount, steamApiKey.trim() || undefined);
      await persistGamesToSQLite(mergedGames);

      setBannerMsg({
        type: "success",
        text: `Compte Steam "${fetchedAccount.displayName}" synchronisé ! ${steamGamesToSync.length} jeux importés et sauvegardés dans SQLite.`,
      });
    } catch (err: any) {
      setBannerMsg({
        type: "error",
        text: err.message || "Erreur lors de la synchronisation Steam.",
      });
    } finally {
      setIsSyncingSteam(false);
      setSyncProgressText(null);
    }
  };

  const handleConnectAndSyncXbox = async (overrideUser?: string) => {
    const targetUser = (overrideUser || xboxInput).trim();
    if (!targetUser) return;
    setIsSyncingXbox(true);
    setBannerMsg(null);
    try {
      const keyParam = xboxApiKey ? `&key=${encodeURIComponent(xboxApiKey)}` : "";
      const res = await fetch(
        `/api/profile/xbox?user=${encodeURIComponent(targetUser)}${keyParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de synchroniser avec Xbox.");
      }
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(data.account, xboxApiKey.trim() || undefined);
      if (Array.isArray(data.discoveredGames) && data.discoveredGames.length > 0) {
        const merged = mergeGamesList(ownedGames, data.discoveredGames);
        onOwnedGamesChange(merged);
        await persistGamesToSQLite(data.discoveredGames);
      }
      setBannerMsg({
        type: "success",
        text: data.notice || `Compte Xbox Live "${data.account.displayName}" synchronisé (${data.discoveredGames?.length || 0} jeux découverts) !`,
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

  const handleConnectAndSyncEpic = async (overrideUser?: string) => {
    const targetUser = (overrideUser || epicInput).trim();
    const targetCode = epicCode.trim();
    if (!targetUser && !targetCode) return;
    setIsSyncingEpic(true);
    setBannerMsg(null);
    setSyncProgressText("Importation de la bibliothèque Epic Games...");
    try {
      const userParam = targetUser ? `user=${encodeURIComponent(targetUser)}` : "";
      const codeParam = targetCode ? `code=${encodeURIComponent(targetCode)}` : "";
      const query = [userParam, codeParam, "resolveAchievements=1"]
        .filter(Boolean)
        .join("&");
      const res = await fetch(`/api/profile/epic?${query}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de synchroniser avec Epic Games.");
      }

      hasAutoEnrichedEpicRef.current = true;
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(data.account);

      let currentMerged = ownedGames;
      if (Array.isArray(data.discoveredGames) && data.discoveredGames.length > 0) {
        currentMerged = replacePlatformInList(ownedGames, "epic", data.discoveredGames);
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

  const handleConnectAndSyncGOG = async (overrideUser?: string) => {
    const targetUser = (overrideUser || gogInput).trim();
    if (!targetUser) return;
    setIsSyncingGOG(true);
    setBannerMsg(null);
    try {
      const tokenParam = gogToken ? `&token=${encodeURIComponent(gogToken)}` : "";
      const res = await fetch(
        `/api/profile/gog?user=${encodeURIComponent(targetUser)}${tokenParam}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de joindre GOG.");
      }
      updateAccountProfileInMemory(data.account);
      await persistAccountToSQLite(data.account, gogToken.trim() || undefined);
      if (Array.isArray(data.discoveredGames) && data.discoveredGames.length > 0) {
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
    const completed =
      parseInt(platForm.completedGames, 10) || platCount || 0;

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

  const handleRemoveGame = async (appId: number, platform: PlatformType) => {
    const next = ownedGames.filter(
      (item) => !(item.appId === appId && item.platform === platform)
    );
    onOwnedGamesChange(next);
    await removeGameFromSQLite(appId, platform);
  };

  const handleSyncGame = async (g: OwnedGame) => {
    const steamAccount = accountProfile.accounts.steam;
    if (g.platform === "steam" && steamAccount?.username) {
      const synced = await syncSingleSteamGame(steamAccount.username, g);
      const next = mergeGamesList(ownedGames, [synced]);
      onOwnedGamesChange(next);
      await persistGamesToSQLite([synced]);
      setBannerMsg({
        type: "success",
        text: `Succès de "${synced.name}" synchronisés (${synced.unlockedCount}/${synced.totalAchievements}) !`,
      });
    } else if (g.platform === "epic") {
      try {
        const res = await fetch(
          `/api/sync?platform=epic&appId=${g.appId}&gameName=${encodeURIComponent(g.name)}`
        );
        if (res.ok) {
          const data = await res.json();
          const updatedGame: OwnedGame = {
            ...g,
            unlockedCount: data.unlockedCount ?? g.unlockedCount,
            totalAchievements: data.totalAchievements ?? g.totalAchievements,
          };
          const next = mergeGamesList(ownedGames, [updatedGame]);
          onOwnedGamesChange(next);
          await persistGamesToSQLite([updatedGame]);
          setBannerMsg({
            type: "success",
            text: `Succès Epic de "${g.name}" synchronisés (${updatedGame.unlockedCount}/${updatedGame.totalAchievements}) !`,
          });
          return;
        }
      } catch (e) {
        console.warn("Epic single sync error, falling back:", e);
      }
      const next = await enrichEpicGamesAchievements(
        [{ ...g, totalAchievements: 0 }],
        ownedGames
      );
      const updatedGame = next.find(
        (item) => item.appId === g.appId && item.platform === "epic"
      );
      setBannerMsg({
        type: "success",
        text: `Succès de "${g.name}" actualisés (${updatedGame?.totalAchievements || 0} succès détectés) !`,
      });
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

  const handleCleanEpicGames = async (epicNoAchCount: number, epicWithAchCount: number) => {
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
    isSyncingSteam,
    isSyncingXbox,
    isSyncingEpic,
    isSyncingGOG,
    syncProgressText,
    editingPlatform,
    setEditingPlatform,
    platForm,
    setPlatForm,
    syncSingleSteamGame,
    enrichEpicGamesAchievements,
    persistGamesToSQLite,
    removeGameFromSQLite,
    handleConnectAndSyncSteam,
    handleConnectAndSyncXbox,
    handleConnectAndSyncEpic,
    handleConnectAndSyncGOG,
    openEditPlatform,
    handleSavePlatformModal,
    handleDisconnectPlatform,
    handleSyncGame,
    handleRemoveGame,
    handleScanEpicAchievements,
    handleCleanEpicGames,
  };
}
