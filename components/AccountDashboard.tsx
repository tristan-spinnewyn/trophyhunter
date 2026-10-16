"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  User,
  RefreshCw,
  Gamepad2,
  Sparkles,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Award,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Edit3,
  Upload,
  AlertCircle,
  Loader2,
  ChevronRight,
  Star,
} from "lucide-react";
import type {
  UserAccountProfile,
  PlatformType,
  PlatformAccount,
  OwnedGame,
  GameSearchResult,
} from "@/lib/types";
import {
  PLATFORM_META,
  savePlatformAccount,
  removePlatformAccount,
  upsertOwnedGames,
  removeOwnedGame,
  getGameProgress,
  saveGameProgress,
  getSavedSteamApiKey,
  saveSteamApiKey,
} from "@/lib/storage";

interface AccountDashboardProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSelectGame: (appId: number) => void;
  onSteamUserChange: (steamUser: string) => void;
}

const ALL_PLATFORMS: PlatformType[] = [
  "steam",
  "xbox",
  "epic",
  "gog",
  "playstation",
  "retroachievements",
  "nintendo",
];

export default function AccountDashboard({
  accountProfile,
  ownedGames,
  onAccountChange,
  onOwnedGamesChange,
  onSelectGame,
  onSteamUserChange,
}: AccountDashboardProps) {
  const steamAccount = accountProfile.accounts.steam;
  const [steamInput, setSteamInput] = useState(
    steamAccount?.username || "76561198083390097"
  );
  const [steamApiKey, setSteamApiKey] = useState(() => getSavedSteamApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Platform Navigation & Library Filters
  const [activePlatformTab, setActivePlatformTab] = useState<
    PlatformType | "all"
  >("all");
  const [libPlatformFilter, setLibPlatformFilter] = useState<
    PlatformType | "all"
  >("all");
  const [libStatusFilter, setLibStatusFilter] = useState<
    "all" | "completed" | "in-progress" | "unstarted"
  >("all");
  const [libAchievementFilter, setLibAchievementFilter] = useState<
    "all" | "with-achievements" | "no-achievements"
  >("all");
  const [libSortOrder, setLibSortOrder] = useState<
    | "default"
    | "achievements-desc"
    | "achievements-asc"
    | "completion-desc"
    | "name-asc"
    | "playtime-desc"
  >("default");
  const [libSearch, setLibSearch] = useState("");

  // Add/Edit Platform Modal state
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

  // Add Game / Bulk Import Modal state
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [addGameQuery, setAddGameQuery] = useState("");
  const [addGameResults, setAddGameResults] = useState<GameSearchResult[]>([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);
  const [selectedPlatformForAdd, setSelectedPlatformForAdd] =
    useState<PlatformType>("steam");
  const [bulkImportText, setBulkImportText] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Sync a single game's achievements from Steam and update local storage + library
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

      const currentProg = getGameProgress(game.appId);
      const unlockedIds: string[] =
        data.unlockedIds && data.unlockedIds.length > 0
          ? data.unlockedIds
          : currentProg.unlockedIds;

      const totalAch = data.totalAchievements || game.totalAchievements || 0;
      const unlockedCount = Math.max(
        data.count || 0,
        unlockedIds.length,
        game.unlockedCount || 0
      );

      if (unlockedIds.length > 0) {
        saveGameProgress(
          game.appId,
          {
            ...currentProg,
            unlockedIds,
            lastPlayed: new Date().toISOString(),
          },
          {
            name: data.gameName || game.name,
            headerImg: game.headerImg,
            totalAchievements: totalAch,
            platform: "steam",
          }
        );
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

  // Full Steam Profile + Owned Games + Achievements Sync
  const handleConnectAndSyncSteam = async (targetUser?: string) => {
    const userToSync = (targetUser ?? steamInput).trim();
    if (!userToSync) return;

    if (steamApiKey.trim()) {
      saveSteamApiKey(steamApiKey.trim());
    }

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
      const updatedProfile = savePlatformAccount(fetchedAccount);
      onAccountChange(updatedProfile);

      // Merge discovered games with existing owned games
      let mergedGames = upsertOwnedGames(discovered);
      onOwnedGamesChange(mergedGames);

      // Sync achievements for all Steam games in the library
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

      mergedGames = upsertOwnedGames(updatedSteamGames);
      onOwnedGamesChange(mergedGames);

      // Update account stats if local library found even more achievements/completed games
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

      const finalProfile = savePlatformAccount(finalAccount);
      onAccountChange(finalProfile);

      setBannerMsg({
        type: "success",
        text: `Compte Steam "${fetchedAccount.displayName}" synchronisé ! ${steamGamesToSync.length} jeux importés et succès cochés automatiquement.`,
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

  // Open modal to add/edit another platform account
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

  const handleSavePlatformModal = () => {
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
          editingPlatform === "playstation" || editingPlatform === "epic"
            ? {
                platinum: platCount,
                gold: goldCount,
                silver: silverCount,
                bronze: bronzeCount,
              }
            : undefined,
      },
    };

    const updated = savePlatformAccount(newAcc);
    onAccountChange(updated);
    setEditingPlatform(null);
    setBannerMsg({
      type: "success",
      text: `Compte ${PLATFORM_META[editingPlatform].name} enregistré avec succès !`,
    });
  };

  const handleDisconnectPlatform = (platform: PlatformType) => {
    const updated = removePlatformAccount(platform);
    onAccountChange(updated);
    if (platform === "steam") {
      onSteamUserChange("");
    }
  };

  // Search games to add to Owned Games Library
  const handleSearchAddGame = async (q: string) => {
    setAddGameQuery(q);
    if (q.trim().length < 2) {
      setAddGameResults([]);
      return;
    }
    setIsSearchingAdd(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setAddGameResults(data.games || []);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingAdd(false);
    }
  };

  const handleAddGameToLibrary = async (item: GameSearchResult) => {
    const newGame: OwnedGame = {
      appId: item.id,
      name: item.name,
      headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
      platform: selectedPlatformForAdd,
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: new Date().toISOString(),
      source: "manual",
    };

    let updatedList = upsertOwnedGames([newGame]);
    onOwnedGamesChange(updatedList);

    // Fetch achievement count (and auto-sync if Steam user connected)
    if (selectedPlatformForAdd === "steam" && steamAccount?.username) {
      const synced = await syncSingleSteamGame(steamAccount.username, newGame);
      updatedList = upsertOwnedGames([synced]);
      onOwnedGamesChange(updatedList);
    } else {
      try {
        const r = await fetch(`/api/game/${item.id}`);
        if (r.ok) {
          const gDetails = await r.json();
          updatedList = upsertOwnedGames([
            {
              ...newGame,
              totalAchievements: gDetails.totalAchievements || 0,
            },
          ]);
          onOwnedGamesChange(updatedList);
        }
      } catch {
        // ignore
      }
    }

    setBannerMsg({
      type: "success",
      text: `"${item.name}" ajouté à vos jeux possédés (${PLATFORM_META[selectedPlatformForAdd].shortName}) !`,
    });
  };

  // Parse bulk import text (supports Steam HTML source, JSON, or list of AppIDs/URLs)
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;
    setIsBulkImporting(true);
    try {
      const discovered: OwnedGame[] = [];
      const nowIso = new Date().toISOString();

      // 1. Check if it contains Steam's data-profile-gameslist JSON or rgGames JSON
      const decodedText = bulkImportText
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");

      const appJsonMatches = [
        ...decodedText.matchAll(
          /"appid"\s*:\s*(\d+)\s*,\s*"name"\s*:\s*"([^"]+)"/g
        ),
      ];

      if (appJsonMatches.length > 0) {
        for (const m of appJsonMatches) {
          const appId = parseInt(m[1], 10);
          const name = m[2].replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
            String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16))
          );
          if (appId) {
            discovered.push({
              appId,
              name,
              headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
              platform: "steam",
              totalAchievements: 0,
              unlockedCount: 0,
              addedAt: nowIso,
              source: "steam-import",
            });
          }
        }
      } else {
        // 2. Extract any Steam AppIDs from URLs or comma/space-separated numbers
        const idMatches = [
          ...bulkImportText.matchAll(/(?:app\/|\b)(\d{3,8})\b/g),
        ].map((m) => parseInt(m[1], 10));
        const uniqueIds = [...new Set(idMatches)].slice(0, 60);

        for (const appId of uniqueIds) {
          discovered.push({
            appId,
            name: `Jeu Steam #${appId}`,
            headerImg: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
            platform: "steam",
            totalAchievements: 0,
            unlockedCount: 0,
            addedAt: nowIso,
            source: "steam-import",
          });
        }
      }

      if (discovered.length === 0) {
        setBannerMsg({
          type: "error",
          text: "Aucun jeu ou AppID détecté dans le texte collé.",
        });
        return;
      }

      let merged = upsertOwnedGames(discovered);
      onOwnedGamesChange(merged);

      // Sync the newly imported games if Steam user is connected (up to 15 immediately so it stays fast)
      if (steamAccount?.username) {
        const toSync = discovered.slice(0, 15);
        const syncedBatch: OwnedGame[] = [];
        for (const g of toSync) {
          const s = await syncSingleSteamGame(steamAccount.username, g);
          syncedBatch.push(s);
        }
        merged = upsertOwnedGames(syncedBatch);
        onOwnedGamesChange(merged);
      }

      setBulkImportText("");
      setIsAddGameOpen(false);
      setBannerMsg({
        type: "success",
        text: `${discovered.length} jeux importés dans votre bibliothèque !`,
      });
    } finally {
      setIsBulkImporting(false);
    }
  };

  // Global Aggregated Statistics across all connected platforms + local library
  const globalStats = useMemo(() => {
    const connectedAccounts = Object.values(accountProfile.accounts).filter(
      Boolean
    ) as PlatformAccount[];

    // Calculate local library stats per platform
    const localByPlatform: Record<
      string,
      { games: number; achievements: number; completed: number; hours: number }
    > = {};

    for (const g of ownedGames) {
      if (!localByPlatform[g.platform]) {
        localByPlatform[g.platform] = {
          games: 0,
          achievements: 0,
          completed: 0,
          hours: 0,
        };
      }
      localByPlatform[g.platform].games += 1;
      localByPlatform[g.platform].achievements += g.unlockedCount || 0;
      if (
        g.totalAchievements > 0 &&
        g.unlockedCount >= g.totalAchievements
      ) {
        localByPlatform[g.platform].completed += 1;
      }
      localByPlatform[g.platform].hours += g.playtimeHours || 0;
    }

    let totalGamesOwned = 0;
    let totalAchievementsUnlocked = 0;
    let totalCompletedGames = 0;
    let totalHours = 0;

    const seenPlatforms = new Set<string>();

    for (const acc of connectedAccounts) {
      seenPlatforms.add(acc.platform);
      const local = localByPlatform[acc.platform] || {
        games: 0,
        achievements: 0,
        completed: 0,
        hours: 0,
      };
      totalGamesOwned += Math.max(acc.stats.gamesOwned || 0, local.games);
      totalAchievementsUnlocked += Math.max(
        acc.stats.totalAchievements || 0,
        local.achievements
      );
      totalCompletedGames += Math.max(
        acc.stats.completedGames || 0,
        local.completed
      );
      totalHours += Math.max(acc.stats.hoursPlayed || 0, local.hours);
    }

    for (const [plat, local] of Object.entries(localByPlatform)) {
      if (!seenPlatforms.has(plat)) {
        totalGamesOwned += local.games;
        totalAchievementsUnlocked += local.achievements;
        totalCompletedGames += local.completed;
        totalHours += local.hours;
      }
    }

    // Average completion rate across tracked games in library that have achievements
    const gamesWithAch = ownedGames.filter((g) => g.totalAchievements > 0);
    const avgCompletion =
      gamesWithAch.length > 0
        ? Math.round(
            (gamesWithAch.reduce(
              (acc, g) =>
                acc +
                Math.min(1, (g.unlockedCount || 0) / g.totalAchievements),
              0
            ) /
              gamesWithAch.length) *
              100
          )
        : 0;

    return {
      connectedCount: connectedAccounts.length,
      totalGamesOwned,
      totalAchievementsUnlocked,
      totalCompletedGames,
      totalHours: Math.round(totalHours * 10) / 10,
      avgCompletion,
      trackedGamesCount: ownedGames.length,
    };
  }, [accountProfile, ownedGames]);

  // Per-platform game counts
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ownedGames.length };
    for (const p of ALL_PLATFORMS) {
      counts[p] = 0;
    }
    for (const g of ownedGames) {
      counts[g.platform] = (counts[g.platform] || 0) + 1;
    }
    return counts;
  }, [ownedGames]);

  // Epic-specific achievement breakdown counts
  const epicCounts = useMemo(() => {
    const epicGames = ownedGames.filter((g) => g.platform === "epic");
    const withAch = epicGames.filter((g) => g.totalAchievements > 0).length;
    return {
      total: epicGames.length,
      withAch,
      noAch: epicGames.length - withAch,
    };
  }, [ownedGames]);

  // Filtered & Sorted Owned Games
  const filteredGames = useMemo(() => {
    const targetPlatform =
      activePlatformTab !== "all" ? activePlatformTab : libPlatformFilter;

    const list = ownedGames.filter((g) => {
      if (targetPlatform !== "all" && g.platform !== targetPlatform) {
        return false;
      }
      const isComplete =
        g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements;
      const isInProgress =
        g.unlockedCount > 0 &&
        (g.totalAchievements === 0 || g.unlockedCount < g.totalAchievements);
      const isUnstarted = g.unlockedCount === 0;

      if (libStatusFilter === "completed" && !isComplete) return false;
      if (libStatusFilter === "in-progress" && !isInProgress) return false;
      if (libStatusFilter === "unstarted" && !isUnstarted) return false;

      // Filter by achievement availability (especially crucial for Epic Games)
      if (
        libAchievementFilter === "with-achievements" &&
        g.totalAchievements === 0
      ) {
        return false;
      }
      if (
        libAchievementFilter === "no-achievements" &&
        g.totalAchievements > 0
      ) {
        return false;
      }

      if (libSearch.trim()) {
        const q = libSearch.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !String(g.appId).includes(q)) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (libSortOrder === "achievements-desc") {
        if (b.totalAchievements !== a.totalAchievements) {
          return b.totalAchievements - a.totalAchievements;
        }
        return b.unlockedCount - a.unlockedCount;
      }
      if (libSortOrder === "achievements-asc") {
        if (a.totalAchievements !== b.totalAchievements) {
          return a.totalAchievements - b.totalAchievements;
        }
        return a.unlockedCount - b.unlockedCount;
      }
      if (libSortOrder === "completion-desc") {
        const pctA =
          a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
        const pctB =
          b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
        if (pctB !== pctA) return pctB - pctA;
        return a.name.localeCompare(b.name, "fr");
      }
      if (libSortOrder === "name-asc") {
        return a.name.localeCompare(b.name, "fr");
      }
      if (libSortOrder === "playtime-desc") {
        return (b.playtimeHours || 0) - (a.playtimeHours || 0);
      }
      // default: highest completion % first, then by name
      const pctA =
        a.totalAchievements > 0 ? a.unlockedCount / a.totalAchievements : 0;
      const pctB =
        b.totalAchievements > 0 ? b.unlockedCount / b.totalAchievements : 0;
      if (pctB !== pctA) return pctB - pctA;
      return a.name.localeCompare(b.name, "fr");
    });
  }, [
    ownedGames,
    activePlatformTab,
    libPlatformFilter,
    libStatusFilter,
    libAchievementFilter,
    libSortOrder,
    libSearch,
  ]);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {bannerMsg && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs ${
            bannerMsg.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span className="font-medium">{bannerMsg.text}</span>
          </div>
          <button
            onClick={() => setBannerMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 0. Top Platform Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
          className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 font-bold whitespace-nowrap transition shrink-0 ${
            activePlatformTab === "all"
              ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
              : "border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Vue Globale</span>
          <span
            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "all"
                ? "bg-slate-950/30 text-slate-950 font-black"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {ownedGames.length}
          </span>
        </button>

        {ALL_PLATFORMS.map((plat) => {
          const meta = PLATFORM_META[plat];
          const count = platformCounts[plat] || 0;
          const isConnected = !!accountProfile.accounts[plat];
          const isActive = activePlatformTab === plat;

          return (
            <button
              key={plat}
              onClick={() => {
                setActivePlatformTab(plat);
                setLibPlatformFilter(plat);
              }}
              className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
                isActive
                  ? `${meta.badgeClass} ring-2 ring-current/40 shadow-lg`
                  : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span>{meta.shortName}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-black/30 font-black"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
              {isConnected && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
                  title="Compte lié"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW A: GLOBAL OVERVIEW */}
      {activePlatformTab === "all" && (
        <>
          {/* Global Hunter Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Jeux Possédés</span>
                <Gamepad2 className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {globalStats.totalGamesOwned}
              </div>
              <div className="text-[11px] text-slate-400">
                Dont {globalStats.trackedGamesCount} dans la bibliothèque active
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span className="font-semibold">Platines / 100%</span>
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {globalStats.totalCompletedGames}
              </div>
              <div className="text-[11px] text-slate-400">
                Jeux terminés à 100% tous comptes
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 to-slate-900 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span className="font-semibold">Succès & Trophées</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {globalStats.totalAchievementsUnlocked}
              </div>
              <div className="text-[11px] text-slate-400">
                Débloqués sur {globalStats.connectedCount || 1} plateforme(s)
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/25 to-slate-900 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-purple-300">
                <span className="font-semibold">Complétion Moyenne</span>
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-300">
                {globalStats.avgCompletion}%
              </div>
              <div className="text-[11px] text-slate-400">
                {steamAccount?.stats.badges
                  ? `${steamAccount.stats.badges} Badges Steam • ${
                      steamAccount.stats.dlcCount || 0
                    } DLC`
                  : "Sur vos jeux suivis"}
              </div>
            </div>
          </div>

          {/* Multi-Platform Accounts Section */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-400" />
                  Mes Plateformes de Jeu ({ALL_PLATFORMS.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Cliquez sur un espace pour accéder à sa vue dédiée (Steam, Xbox, Epic Games, GOG...).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_PLATFORMS.map((plat) => {
                const meta = PLATFORM_META[plat];
                const acc = accountProfile.accounts[plat];
                const count = platformCounts[plat] || 0;

                return (
                  <div
                    key={plat}
                    className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
                      acc
                        ? "border-slate-700 bg-slate-950/80 shadow-md"
                        : "border-slate-800/80 bg-slate-950/30 opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                        >
                          {meta.shortName}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {count} jeu(x)
                          </span>
                          {acc ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <Check className="h-3 w-3" /> Lié
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Non lié
                            </span>
                          )}
                        </div>
                      </div>

                      {acc ? (
                        <div className="mt-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="truncate text-sm font-bold text-white">
                              {acc.displayName}
                            </div>
                            {acc.level ? (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                Niv. {acc.level}
                              </span>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900/90 p-2 text-center">
                            <div>
                              <div className="text-xs font-black text-white">
                                {acc.stats.gamesOwned}
                              </div>
                              <div className="text-[10px] text-slate-400">Jeux</div>
                            </div>
                            <div>
                              <div className="text-xs font-black text-emerald-400">
                                {acc.stats.totalAchievements}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {meta.trophyLabel}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-black text-amber-400">
                                {acc.stats.completedGames}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {meta.completeLabel}
                              </div>
                            </div>
                          </div>

                          {acc.stats.gamerScore ? (
                            <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 text-center">
                              {acc.stats.gamerScore.toLocaleString("fr-FR")} G
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">
                          Accédez à l&apos;espace {meta.name} pour configurer vos identifiants et voir vos succès.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setActivePlatformTab(plat);
                          setLibPlatformFilter(plat);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-sky-400 transition hover:bg-slate-700 hover:text-white"
                      >
                        <span>Ouvrir l&apos;espace</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => openEditPlatform(plat)}
                        title="Modifier les statistiques ou l'identifiant"
                        className="rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {acc && (
                        <button
                          onClick={() => handleDisconnectPlatform(plat)}
                          title="Supprimer ce compte"
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rare Achievements Showcase */}
          {steamAccount?.rareShowcase && steamAccount.rareShowcase.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400" />
                  Vitrine de vos succès les plus rares
                </h3>
                <span className="text-[11px] text-slate-400">
                  Cliquez pour ouvrir le jeu
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {steamAccount.rareShowcase.map((item, idx) => (
                  <button
                    key={`${item.appId}_${idx}`}
                    onClick={() => onSelectGame(item.appId)}
                    className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-slate-950/70 p-2.5 text-left transition hover:border-amber-500/50 hover:bg-slate-900"
                  >
                    <img
                      src={item.icon}
                      alt={item.achievementName}
                      className="h-11 w-11 rounded-xl object-cover border border-amber-400/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {item.achievementName}
                      </div>
                      <div className="truncate text-[11px] text-slate-400">
                        {item.gameName}
                      </div>
                      <div className="mt-0.5 inline-block rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                        Ultra Rare • {item.percent}% des joueurs
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW B: STEAM DEDICATED VIEW */}
      {activePlatformTab === "steam" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActivePlatformTab("all");
                setLibPlatformFilter("all");
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              ← Retour à la Vue Globale
            </button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300">
              Espace Dédié Steam
            </span>
          </div>

          {/* Steam Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {steamAccount?.avatarUrl ? (
                    <img
                      src={steamAccount.avatarUrl}
                      alt={steamAccount.displayName}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-sky-500/50 shadow-lg shadow-sky-500/20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-sky-400">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  {steamAccount?.level ? (
                    <div
                      title="Niveau Steam"
                      className="absolute -bottom-1.5 -right-1.5 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-br from-amber-400 to-amber-600 px-1.5 text-[11px] font-black text-slate-950 shadow"
                    >
                      {steamAccount.level}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {steamAccount?.displayName || accountProfile.displayName}
                    </h2>
                    {steamAccount?.onlineState && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          steamAccount.onlineState === "online" ||
                          steamAccount.onlineState === "in-game"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            steamAccount.onlineState === "online" ||
                            steamAccount.onlineState === "in-game"
                              ? "bg-emerald-400"
                              : "bg-slate-500"
                          }`}
                        />
                        {steamAccount.onlineState === "online"
                          ? "En ligne"
                          : steamAccount.onlineState === "in-game"
                          ? "En jeu"
                          : "Hors ligne"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {steamAccount ? (
                      <>
                        <span>SteamID : {steamAccount.username}</span>
                        {steamAccount.location && (
                          <>
                            <span>•</span>
                            <span>{steamAccount.location}</span>
                          </>
                        )}
                        {steamAccount.memberSince && (
                          <>
                            <span>•</span>
                            <span>Membre depuis {steamAccount.memberSince}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span>Renseignez votre SteamID pour synchroniser automatiquement vos succès.</span>
                    )}
                  </div>

                  {steamAccount?.profileUrl && (
                    <div className="pt-1">
                      <a
                        href={steamAccount.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
                      >
                        Voir le profil Steam officiel
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Steam Sync Input Form */}
              <div className="w-full md:w-auto md:min-w-[340px] rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Synchronisation Steam
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {steamApiKey ? "Clé API Active ✓" : "Sans Clé ou Avec Clé"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={steamInput}
                    onChange={(e) => setSteamInput(e.target.value)}
                    placeholder="SteamID64, pseudo ou URL Steam..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleConnectAndSyncSteam()}
                    disabled={isSyncingSteam || !steamInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isSyncingSteam ? "animate-spin" : ""
                      }`}
                    />
                    <span>{isSyncingSteam ? "Sync..." : "Importer"}</span>
                  </button>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="text-[11px] font-semibold text-slate-300 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>{showApiKeyInput ? "▼" : "▶"} Clé API Steam (Optionnelle)</span>
                      {steamApiKey ? (
                        <span className="text-[10px] text-emerald-400 font-bold">• Active</span>
                      ) : null}
                    </button>
                    <a
                      href="https://steamcommunity.com/dev/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      Obtenir ma clé ↗
                    </a>
                  </div>
                  {(showApiKeyInput || steamApiKey) && (
                    <div className="mt-1.5 space-y-1">
                      <input
                        type="password"
                        value={steamApiKey}
                        onChange={(e) => setSteamApiKey(e.target.value)}
                        placeholder="Collez votre clé API Steam..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {syncProgressText ? (
                  <div className="flex items-center gap-2 text-[11px] text-sky-300 pt-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span className="truncate">{syncProgressText}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Importe automatiquement vos jeux et succès Steam sans mot de passe.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Steam Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Jeux Steam</div>
              <div className="text-2xl font-black text-white">{platformCounts.steam}</div>
              <div className="text-[11px] text-slate-400">Dans votre bibliothèque</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
              <div className="text-2xl font-black text-emerald-400">{steamAccount?.stats.totalAchievements || 0}</div>
              <div className="text-[11px] text-slate-400">Sur vos jeux Steam</div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
              <div className="text-2xl font-black text-amber-400">{steamAccount?.stats.completedGames || 0}</div>
              <div className="text-[11px] text-slate-400">Platines Steam</div>
            </div>
            <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-sky-300">Badges & DLC</div>
              <div className="text-2xl font-black text-sky-400">{steamAccount?.stats.badges || 0}</div>
              <div className="text-[11px] text-slate-400">{steamAccount?.stats.dlcCount || 0} DLC possédés</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: XBOX LIVE DEDICATED VIEW */}
      {activePlatformTab === "xbox" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActivePlatformTab("all");
                setLibPlatformFilter("all");
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              ← Retour à la Vue Globale
            </button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              Espace Dédié Xbox Live & PC Game Pass
            </span>
          </div>

          {/* Xbox Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {accountProfile.accounts.xbox?.displayName || "Compte Xbox Live"}
                    </h2>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Xbox & PC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gamertag : {accountProfile.accounts.xbox?.username || "Non configuré"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-300">
                    <Trophy className="h-3.5 w-3.5" />
                    {accountProfile.accounts.xbox?.stats.gamerScore
                      ? `${accountProfile.accounts.xbox.stats.gamerScore.toLocaleString("fr-FR")} G (Gamerscore)`
                      : "0 G"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditPlatform("xbox")}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Modifier Gamertag & Stats
                </button>
              </div>
            </div>
          </div>

          {/* Xbox Information Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-200">
                Synchronisation Xbox Live & PC Game Pass par API
              </p>
              <p className="text-[11px] text-slate-400">
                Vous pouvez ajouter vos jeux Xbox (console et PC) ci-dessous. En reliant votre Gamertag via OpenXBL, l&apos;intégralité de vos succès, raretés et Gamerscore sont automatiquement suivis sans entrer de mot de passe.
              </p>
            </div>
          </div>

          {/* Xbox Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Jeux Xbox Suivis</div>
              <div className="text-2xl font-black text-white">{platformCounts.xbox}</div>
              <div className="text-[11px] text-slate-400">Console & PC Game Pass</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-emerald-300">Succès Débloqués</div>
              <div className="text-2xl font-black text-emerald-400">
                {accountProfile.accounts.xbox?.stats.totalAchievements || 0}
              </div>
              <div className="text-[11px] text-slate-400">Succès Xbox</div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-300">Jeux 1000G / 100%</div>
              <div className="text-2xl font-black text-amber-400">
                {accountProfile.accounts.xbox?.stats.completedGames || 0}
              </div>
              <div className="text-[11px] text-slate-400">Jeux complétés</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW D: EPIC GAMES DEDICATED VIEW */}
      {activePlatformTab === "epic" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActivePlatformTab("all");
                setLibPlatformFilter("all");
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              ← Retour à la Vue Globale
            </button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300">
              Espace Dédié Epic Games Store
            </span>
          </div>

          {/* Epic Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/40 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-400 shrink-0">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {accountProfile.accounts.epic?.displayName || "Compte Epic Games"}
                    </h2>
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      Epic XP & Platines
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pseudo Epic : {accountProfile.accounts.epic?.username || "Non configuré"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 px-3 py-1 text-xs font-black text-purple-300">
                      <Trophy className="h-3.5 w-3.5" />
                      {accountProfile.accounts.epic?.stats.completedGames || 0} Platine(s) Epic
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
                      {accountProfile.accounts.epic?.stats.totalAchievements || 0} Succès XP
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditPlatform("epic")}
                  className="rounded-xl border border-purple-500/40 bg-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Modifier profil Epic & stats
                </button>
              </div>
            </div>
          </div>

          {/* Epic Achievement System Info & Dedicated Quick Filters */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-purple-200">
                  Tri & Filtrage des succès Epic Games
                </p>
                <p className="text-[11px] text-slate-300">
                  Sur l&apos;Epic Games Store, certains jeux intègrent les <strong>Succès Epic Games</strong> (avec points XP et Trophée Platine), tandis que d&apos;autres n&apos;en ont pas. Utilisez ces filtres rapides pour isoler les jeux avec succès :
                </p>
              </div>
            </div>

            {/* Quick Pills for Epic Achievements */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-500/20">
              <button
                onClick={() => setLibAchievementFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  libAchievementFilter === "all"
                    ? "bg-purple-500 text-slate-950 shadow-md"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                }`}
              >
                Tous les jeux Epic ({epicCounts.total})
              </button>
              <button
                onClick={() => setLibAchievementFilter("with-achievements")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  libAchievementFilter === "with-achievements"
                    ? "bg-purple-500 text-slate-950 shadow-md"
                    : "border border-purple-500/40 bg-purple-950/60 text-purple-300 hover:bg-purple-900/60"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                Avec succès Epic XP uniquement ({epicCounts.withAch})
              </button>
              <button
                onClick={() => setLibAchievementFilter("no-achievements")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  libAchievementFilter === "no-achievements"
                    ? "bg-slate-700 text-white shadow-md"
                    : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                Sans succès ({epicCounts.noAch})
              </button>
            </div>
          </div>

          {/* Epic Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Total Jeux Epic</div>
              <div className="text-2xl font-black text-white">{epicCounts.total}</div>
              <div className="text-[11px] text-slate-400">Bibliothèque Epic</div>
            </div>
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-purple-300">Avec Succès XP</div>
              <div className="text-2xl font-black text-purple-400">{epicCounts.withAch}</div>
              <div className="text-[11px] text-slate-400">Chasse aux trophées active</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-500">Sans Succès</div>
              <div className="text-2xl font-black text-slate-400">{epicCounts.noAch}</div>
              <div className="text-[11px] text-slate-500">Pas de succès répertoriés</div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-300">Platines Epic</div>
              <div className="text-2xl font-black text-amber-400">
                {accountProfile.accounts.epic?.stats.completedGames || 0}
              </div>
              <div className="text-[11px] text-slate-400">Jeux complétés à 100%</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW E: GOG GALAXY DEDICATED VIEW */}
      {activePlatformTab === "gog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActivePlatformTab("all");
                setLibPlatformFilter("all");
              }}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
            >
              ← Retour à la Vue Globale
            </button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300">
              Espace Dédié GOG Galaxy & Web API
            </span>
          </div>

          {/* GOG Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-violet-950/40 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-500/10 text-violet-400 shrink-0">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {accountProfile.accounts.gog?.displayName || "Compte GOG Galaxy"}
                    </h2>
                    <span className="rounded-full bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      GOG.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pseudo GOG : {accountProfile.accounts.gog?.username || "Non configuré"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-950/60 border border-violet-500/30 px-3 py-1 text-xs font-black text-violet-300">
                    <Trophy className="h-3.5 w-3.5" />
                    {accountProfile.accounts.gog?.stats.completedGames || 0} Jeux 100% GOG
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditPlatform("gog")}
                  className="rounded-xl border border-violet-500/40 bg-violet-500/20 px-3.5 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/30 transition flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Modifier profil GOG & stats
                </button>
              </div>
            </div>
          </div>

          {/* GOG Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Jeux GOG</div>
              <div className="text-2xl font-black text-white">{platformCounts.gog}</div>
              <div className="text-[11px] text-slate-400">Bibliothèque GOG</div>
            </div>
            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-violet-300">Succès Débloqués</div>
              <div className="text-2xl font-black text-violet-400">
                {accountProfile.accounts.gog?.stats.totalAchievements || 0}
              </div>
              <div className="text-[11px] text-slate-400">Succès GOG</div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-300">Jeux 100%</div>
              <div className="text-2xl font-black text-amber-400">
                {accountProfile.accounts.gog?.stats.completedGames || 0}
              </div>
              <div className="text-[11px] text-slate-400">Platines GOG</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW F: PLAYSTATION / RETRO / NINTENDO */}
      {(activePlatformTab === "playstation" ||
        activePlatformTab === "retroachievements" ||
        activePlatformTab === "nintendo") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActivePlatformTab("all");
                setLibPlatformFilter("all");
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              ← Retour à la Vue Globale
            </button>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${PLATFORM_META[activePlatformTab].badgeClass}`}>
              Espace Dédié {PLATFORM_META[activePlatformTab].name}
            </span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white">
                {accountProfile.accounts[activePlatformTab]?.displayName || PLATFORM_META[activePlatformTab].name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Identifiant : {accountProfile.accounts[activePlatformTab]?.username || "Non configuré"}
              </p>
              {accountProfile.accounts[activePlatformTab]?.stats.trophies && (
                <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                  <span className="text-sky-300">🏆 {accountProfile.accounts[activePlatformTab]?.stats.trophies?.platinum} Platine</span>
                  <span className="text-amber-300">🥇 {accountProfile.accounts[activePlatformTab]?.stats.trophies?.gold} Or</span>
                  <span className="text-slate-300">🥈 {accountProfile.accounts[activePlatformTab]?.stats.trophies?.silver} Argent</span>
                  <span className="text-amber-600">🥉 {accountProfile.accounts[activePlatformTab]?.stats.trophies?.bronze} Bronze</span>
                </div>
              )}
            </div>

            <button
              onClick={() => openEditPlatform(activePlatformTab)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Modifier profil & stats
            </button>
          </div>
        </div>
      )}

      {/* 5. Owned Games Library ("Mes Jeux Possédés") */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-sky-400" />
              {activePlatformTab === "all"
                ? `Mes Jeux Possédés (${filteredGames.length}${ownedGames.length !== filteredGames.length ? ` / ${ownedGames.length}` : ""})`
                : `Mes Jeux ${PLATFORM_META[activePlatformTab].name} (${filteredGames.length}${platformCounts[activePlatformTab] !== filteredGames.length ? ` / ${platformCounts[activePlatformTab]}` : ""})`}
            </h3>
            <p className="text-xs text-slate-400">
              Cliquez sur un jeu pour consulter sa checklist de succès en
              français et ses guides.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddGameOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-md shadow-sky-500/20 transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              Ajouter / Importer des jeux
            </button>
          </div>
        </div>

        {/* Informative banner if Steam profile has more games than discovered */}
        {steamAccount && steamAccount.stats.gamesOwned > ownedGames.length && activePlatformTab !== "epic" && activePlatformTab !== "xbox" && activePlatformTab !== "gog" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-sky-200">
                  Steam indique que vous possédez {steamAccount.stats.gamesOwned} jeux ({ownedGames.length} jeux publics synchronisés).
                </p>
                <p className="text-[11px] text-slate-400">
                  Valve restreint la liste complète des jeux possédés aux requêtes authentifiées. Pour importer l&apos;ensemble de vos {steamAccount.stats.gamesOwned} jeux d&apos;un coup, ajoutez votre clé API Steam gratuite ci-dessus ou collez-les via l&apos;import en masse.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setShowApiKeyInput(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-xl border border-sky-500/40 bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition"
              >
                Ajouter clé API
              </button>
              <button
                onClick={() => setIsAddGameOpen(true)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Import en masse
              </button>
            </div>
          </div>
        )}

        {/* Library Filter Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              placeholder="Rechercher dans mes jeux possédés..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          {activePlatformTab === "all" && (
            <select
              value={libPlatformFilter}
              onChange={(e) => setLibPlatformFilter(e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="all">Toutes les plateformes</option>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_META[p].name}
                </option>
              ))}
            </select>
          )}

          <select
            value={libStatusFilter}
            onChange={(e) => setLibStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">🏆 Terminés à 100% (Platine)</option>
            <option value="in-progress">🔥 En cours</option>
            <option value="unstarted">⏳ À commencer (0%)</option>
          </select>

          {/* Achievement filter - especially helpful for Epic Games */}
          <select
            value={libAchievementFilter}
            onChange={(e) => setLibAchievementFilter(e.target.value as any)}
            className={`rounded-xl border px-3 py-2 text-xs outline-none transition ${
              libAchievementFilter !== "all"
                ? "border-purple-500/50 bg-purple-950/40 text-purple-200 font-bold"
                : "border-slate-800 bg-slate-950 text-slate-200 focus:border-sky-500"
            }`}
          >
            <option value="all">Tous les succès</option>
            <option value="with-achievements">🏆 Avec succès uniquement</option>
            <option value="no-achievements">⚪ Sans succès répertoriés</option>
          </select>

          {/* Sort order */}
          <select
            value={libSortOrder}
            onChange={(e) => setLibSortOrder(e.target.value as any)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
          >
            <option value="default">Tri : Progression</option>
            <option value="achievements-desc">🏆 Nombre de succès (Décroissant)</option>
            <option value="achievements-asc">Nombre de succès (Croissant)</option>
            <option value="completion-desc">📈 Platines / 100% en premier</option>
            <option value="name-asc">🔤 Nom (A-Z)</option>
            <option value="playtime-desc">⏱️ Temps de jeu</option>
          </select>
        </div>

        {/* Owned Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredGames.map((g) => {
              const pct =
                g.totalAchievements > 0
                  ? Math.min(
                      100,
                      Math.round((g.unlockedCount / g.totalAchievements) * 100)
                    )
                  : 0;
              const isPlatinum =
                g.totalAchievements > 0 &&
                g.unlockedCount >= g.totalAchievements;
              const pMeta = PLATFORM_META[g.platform] || PLATFORM_META.steam;

              return (
                <div
                  key={`${g.platform}_${g.appId}`}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition hover:shadow-xl ${
                    isPlatinum
                      ? "border-amber-500/50 bg-gradient-to-br from-amber-950/25 via-slate-950 to-slate-900"
                      : "border-slate-800 bg-slate-950/90 hover:border-sky-500/50"
                  }`}
                >
                  {/* Cover Image */}
                  <div
                    onClick={() => onSelectGame(g.appId)}
                    className="relative h-28 w-full cursor-pointer overflow-hidden bg-slate-900"
                  >
                    <img
                      src={g.headerImg}
                      alt={g.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    {/* Platform Badge */}
                    <span
                      className={`absolute left-2.5 top-2.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${pMeta.badgeClass}`}
                    >
                      {pMeta.shortName}
                    </span>

                    {/* Platinum Badge or Achievement Badge */}
                    {isPlatinum ? (
                      <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 backdrop-blur-md">
                        <Trophy className="h-3 w-3 fill-amber-400" />
                        100%
                      </span>
                    ) : g.totalAchievements > 0 ? (
                      <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md">
                        <Trophy className="h-2.5 w-2.5 text-amber-400" />
                        {g.totalAchievements} {g.platform === "epic" ? "XP" : "succès"}
                      </span>
                    ) : (
                      <span className="absolute right-2.5 top-2.5 rounded-lg border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold text-slate-400 backdrop-blur-md">
                        Sans succès
                      </span>
                    )}

                    {/* Playtime */}
                    {g.playtimeHours !== undefined && g.playtimeHours > 0 && (
                      <span className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-slate-300">
                        <Clock className="h-2.5 w-2.5 text-sky-400" />
                        {g.playtimeHours} h
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col justify-between p-3 space-y-2.5">
                    <div
                      onClick={() => onSelectGame(g.appId)}
                      className="cursor-pointer"
                    >
                      <h4 className="truncate text-sm font-bold text-white group-hover:text-sky-400">
                        {g.name}
                      </h4>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {g.totalAchievements > 0
                            ? `${g.unlockedCount} / ${g.totalAchievements} succès`
                            : "⚪ Aucun succès répertorié"}
                        </span>
                        <span
                          className={`font-bold ${
                            isPlatinum
                              ? "text-amber-400"
                              : pct > 0
                              ? "text-sky-400"
                              : "text-slate-500"
                          }`}
                        >
                          {g.totalAchievements > 0 ? `${pct}%` : "—"}
                        </span>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPlatinum
                              ? "bg-gradient-to-r from-amber-400 to-emerald-400"
                              : "bg-sky-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/70">
                      <button
                        onClick={() => onSelectGame(g.appId)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                      >
                        Ouvrir les succès
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {g.platform === "steam" && steamAccount?.username && (
                          <button
                            onClick={async () => {
                              const synced = await syncSingleSteamGame(
                                steamAccount.username,
                                g
                              );
                              const next = upsertOwnedGames([synced]);
                              onOwnedGamesChange(next);
                              setBannerMsg({
                                type: "success",
                                text: `Succès de "${synced.name}" synchronisés (${synced.unlockedCount}/${synced.totalAchievements}) !`,
                              });
                            }}
                            title="Synchroniser les succès Steam de ce jeu"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const next = removeOwnedGame(g.appId, g.platform);
                            onOwnedGamesChange(next);
                          }}
                          title="Retirer de ma bibliothèque"
                          className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-8 text-center space-y-3">
            <Gamepad2 className="h-8 w-8 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {ownedGames.length === 0
                  ? "Votre bibliothèque est encore vide"
                  : "Aucun jeu ne correspond à ce filtre"}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {ownedGames.length === 0
                  ? "Cliquez sur « Importer Jeux & Succès » en haut avec votre SteamID pour importer automatiquement vos jeux et vos succès débloqués !"
                  : "Essayez de modifier vos filtres de plateforme ou de statut."}
              </p>
            </div>
            {ownedGames.length === 0 && (
              <button
                onClick={() => handleConnectAndSyncSteam()}
                disabled={isSyncingSteam}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isSyncingSteam ? "animate-spin" : ""
                  }`}
                />
                Importer mes jeux Steam maintenant
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Edit/Add Platform Account & Stats */}
      {editingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Compte {PLATFORM_META[editingPlatform].name}
              </h3>
              <button
                onClick={() => setEditingPlatform(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Identifiant / Pseudo (sans clé API)
                </label>
                <input
                  type="text"
                  value={platForm.username}
                  onChange={(e) =>
                    setPlatForm({ ...platForm, username: e.target.value })
                  }
                  placeholder={PLATFORM_META[editingPlatform].placeholder}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              {editingPlatform !== "steam" && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400">
                        Jeux possédés
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platForm.gamesOwned}
                        onChange={(e) =>
                          setPlatForm({
                            ...platForm,
                            gamesOwned: e.target.value,
                          })
                        }
                        placeholder="Ex: 45"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">
                        Niveau du compte
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platForm.level}
                        onChange={(e) =>
                          setPlatForm({ ...platForm, level: e.target.value })
                        }
                        placeholder="Ex: 240"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400">
                        {PLATFORM_META[editingPlatform].trophyLabel} débloqués
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platForm.totalAchievements}
                        onChange={(e) =>
                          setPlatForm({
                            ...platForm,
                            totalAchievements: e.target.value,
                          })
                        }
                        placeholder="Ex: 1250"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">
                        {PLATFORM_META[editingPlatform].completeLabel}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platForm.completedGames}
                        onChange={(e) =>
                          setPlatForm({
                            ...platForm,
                            completedGames: e.target.value,
                          })
                        }
                        placeholder="Ex: 12"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {(editingPlatform === "playstation" ||
                    editingPlatform === "epic") && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Détail des Trophées (Platine, Or, Argent, Bronze)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={platForm.platinum}
                          onChange={(e) =>
                            setPlatForm({
                              ...platForm,
                              platinum: e.target.value,
                            })
                          }
                          placeholder="🏆 Plat"
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-sky-500"
                        />
                        <input
                          type="number"
                          min="0"
                          value={platForm.gold}
                          onChange={(e) =>
                            setPlatForm({ ...platForm, gold: e.target.value })
                          }
                          placeholder="🥇 Or"
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-sky-500"
                        />
                        <input
                          type="number"
                          min="0"
                          value={platForm.silver}
                          onChange={(e) =>
                            setPlatForm({ ...platForm, silver: e.target.value })
                          }
                          placeholder="🥈 Arg"
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-sky-500"
                        />
                        <input
                          type="number"
                          min="0"
                          value={platForm.bronze}
                          onChange={(e) =>
                            setPlatForm({ ...platForm, bronze: e.target.value })
                          }
                          placeholder="🥉 Brz"
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {(editingPlatform === "xbox" ||
                    editingPlatform === "retroachievements") && (
                    <div>
                      <label className="text-[11px] text-slate-400">
                        {editingPlatform === "xbox"
                          ? "Gamerscore total (G)"
                          : "Points RetroAchievements"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platForm.gamerScore}
                        onChange={(e) =>
                          setPlatForm({
                            ...platForm,
                            gamerScore: e.target.value,
                          })
                        }
                        placeholder="Ex: 42500"
                        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingPlatform(null)}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePlatformModal}
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                {editingPlatform === "steam"
                  ? "Synchroniser Steam"
                  : "Enregistrer le compte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Game to Owned Library or Bulk Import */}
      {isAddGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-sky-400" />
                Ajouter des jeux possédés à ma bibliothèque
              </h3>
              <button
                onClick={() => setIsAddGameOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Platform selector for added game */}
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  1. Choisir la plateforme du jeu :
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ALL_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPlatformForAdd(p)}
                      className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
                        selectedPlatformForAdd === p
                          ? PLATFORM_META[p].badgeClass
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {PLATFORM_META[p].shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant search & add */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  2. Chercher et ajouter un jeu en 1 clic :
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={addGameQuery}
                    onChange={(e) => handleSearchAddGame(e.target.value)}
                    placeholder="Ex: Elden Ring, God of War, Hades..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                {isSearchingAdd && (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                    Recherche en cours...
                  </div>
                )}

                {addGameResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-1.5">
                    {addGameResults.map((item) => {
                      const alreadyOwned = ownedGames.some(
                        (g) =>
                          g.appId === item.id &&
                          g.platform === selectedPlatformForAdd
                      );
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-slate-900"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.img}
                              alt={item.name}
                              className="h-8 w-14 rounded object-cover bg-slate-800 shrink-0"
                            />
                            <span className="truncate text-xs font-medium text-white">
                              {item.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddGameToLibrary(item)}
                            disabled={alreadyOwned}
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              alreadyOwned
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                            }`}
                          >
                            {alreadyOwned ? "✓ Possédé" : "+ Ajouter"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bulk Import without API Key */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Import massif Steam (AppIDs ou code source de votre page Jeux)
                </label>
                <p className="text-[11px] text-slate-400">
                  Vous pouvez coller une liste d&apos;AppIDs Steam (ex:{" "}
                  <code>1091500, 1245620, 367520</code>) ou le code source de
                  votre page{" "}
                  <code>steamcommunity.com/my/games/?tab=all</code> pour
                  importer tous vos jeux d&apos;un coup sans clé API !
                </p>
                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  rows={3}
                  placeholder="Collez ici des AppIDs, URLs Steam ou le code HTML de votre page de jeux..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkImportText.trim() || isBulkImporting}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
                >
                  {isBulkImporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Importer dans ma bibliothèque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
