"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Gamepad2,
  Sparkles,
  Plus,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Heart,
  Folder,
  FolderPlus,
  Database,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import type {
  UserAccountProfile,
  PlatformType,
  OwnedGame,
  GameSearchResult,
  User as UserType,
} from "@/lib/types";
import {
  ALL_PLATFORMS,
  PLATFORM_META,
  normalizeGameTitle,
  LocalCollection,
} from "@/lib/storage";

import OverviewPanel from "@/components/dashboard/OverviewPanel";
import PlatformSteamPanel from "@/components/dashboard/PlatformSteamPanel";
import PlatformXboxPanel from "@/components/dashboard/PlatformXboxPanel";
import PlatformEpicPanel from "@/components/dashboard/PlatformEpicPanel";
import PlatformGogPanel from "@/components/dashboard/PlatformGogPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import LibraryGameCard from "@/components/dashboard/LibraryGameCard";
import EditPlatformModal from "@/components/dashboard/EditPlatformModal";
import AddGameModal from "@/components/dashboard/AddGameModal";

import { useDashboardCollections } from "@/components/dashboard/hooks/useDashboardCollections";
import { useBulkImport } from "@/components/dashboard/hooks/useBulkImport";
import { usePlatformSync } from "@/components/dashboard/hooks/usePlatformSync";

interface AccountDashboardProps {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSelectGame: (appId: number) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  initialSteamApiKey?: string;
  initialWishlist?: number[];
  initialCollections?: LocalCollection[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: LocalCollection[]) => void;
}

function mergeGamesList(base: OwnedGame[], incoming: OwnedGame[]): OwnedGame[] {
  const map = new Map<string, OwnedGame>();
  for (const g of base) {
    map.set(`${g.platform}_${g.appId}`, g);
  }
  for (const g of incoming) {
    const key = `${g.platform}_${g.appId}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        ...g,
        totalAchievements:
          g.totalAchievements > 0
            ? g.totalAchievements
            : existing.totalAchievements,
        unlockedCount: Math.max(g.unlockedCount || 0, existing.unlockedCount || 0),
        playtimeHours: g.playtimeHours ?? existing.playtimeHours,
        addedAt: existing.addedAt || g.addedAt,
      });
    } else {
      map.set(key, g);
    }
  }
  return Array.from(map.values());
}

export default function AccountDashboard({
  accountProfile,
  ownedGames,
  onAccountChange,
  onOwnedGamesChange,
  onSelectGame,
  onSteamUserChange,
  currentUser,
  onOpenAuthModal,
  initialSteamApiKey = "",
  initialWishlist = [],
  initialCollections = [],
  onWishlistChange,
  onCollectionsChange,
}: AccountDashboardProps) {
  const steamAccount = accountProfile.accounts.steam;
  const xboxAccount = accountProfile.accounts.xbox;
  const epicAccount = accountProfile.accounts.epic;
  const gogAccount = accountProfile.accounts.gog;

  // Platform input states
  const [steamInput, setSteamInput] = useState(steamAccount?.username || "");
  const [steamApiKey, setSteamApiKey] = useState(initialSteamApiKey);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [xboxInput, setXboxInput] = useState(xboxAccount?.username || "");
  const [xboxApiKey, setXboxApiKey] = useState("");
  const [showXboxApiKey, setShowXboxApiKey] = useState(false);

  const [epicInput, setEpicInput] = useState(epicAccount?.username || "");
  const [epicCode, setEpicCode] = useState("");
  const [showEpicCode, setShowEpicCode] = useState(false);

  const [gogInput, setGogInput] = useState(gogAccount?.username || "");
  const [gogToken, setGogToken] = useState("");
  const [showGogToken, setShowGogToken] = useState(false);

  // Status banner & Tab navigation
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [activePlatformTab, setActivePlatformTab] = useState<
    PlatformType | "all" | "duplicates" | "wishlist" | "collections"
  >("all");
  const [libPlatformFilter, setLibPlatformFilter] = useState<PlatformType | "all">("all");
  const [libStatusFilter, setLibStatusFilter] = useState<
    "all" | "completed" | "in-progress" | "unstarted"
  >("all");
  const [libAchievementFilter, setLibAchievementFilter] = useState<
    "all" | "with-achievements" | "no-achievements"
  >("all");
  const [libSortOrder, setLibSortOrder] = useState<
    "default" | "achievements-desc" | "achievements-asc" | "completion-desc" | "name-asc" | "playtime-desc"
  >("default");
  const [libSearch, setLibSearch] = useState("");

  // Add Game Modal states
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [addGameQuery, setAddGameQuery] = useState("");
  const [addGameResults, setAddGameResults] = useState<GameSearchResult[]>([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);
  const [selectedPlatformForAdd, setSelectedPlatformForAdd] = useState<PlatformType>("steam");

  // Hook 1: Collections and Wishlist
  const {
    wishlistIds,
    collections,
    selectedCollId,
    setSelectedCollId,
    newCollName,
    setNewCollName,
    newCollDesc,
    setNewCollDesc,
    isCreatingColl,
    setIsCreatingColl,
    gameToAddToColl,
    setGameToAddToColl,
    handleToggleWishlist,
    handleCreateCollection,
    handleDeleteCollection,
    handleAddGameToColl,
    handleRemoveGameFromColl,
  } = useDashboardCollections({
    currentUser,
    initialWishlist,
    initialCollections,
    onWishlistChange,
    onCollectionsChange,
    setBannerMsg,
  });

  // Hook 2: Platform Sync & Persistence
  const {
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
    persistGamesToSQLite,
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
  } = usePlatformSync({
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
  });

  // Hook 3: Bulk Import
  const {
    bulkImportText,
    setBulkImportText,
    isBulkImporting,
    handleBulkImport,
  } = useBulkImport({
    ownedGames,
    onOwnedGamesChange,
    syncSingleSteamGame,
    persistGamesToSQLite,
    setBannerMsg,
    steamUsername: steamAccount?.username,
    onCloseModal: () => setIsAddGameOpen(false),
  });

  // Derived: Search and Add Games
  const handleSearchAddGame = async (q: string) => {
    setAddGameQuery(q);
    if (q.trim().length < 2) {
      setAddGameResults([]);
      return;
    }
    setIsSearchingAdd(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setAddGameResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingAdd(false);
    }
  };

  const handleAddGameToLibrary = async (item: GameSearchResult) => {
    const nowIso = new Date().toISOString();
    let newGame: OwnedGame = {
      appId: item.id,
      name: item.name,
      headerImg: item.img,
      platform: selectedPlatformForAdd,
      totalAchievements: 0,
      unlockedCount: 0,
      addedAt: nowIso,
      source: "manual",
    };

    let updatedList = mergeGamesList(ownedGames, [newGame]);
    onOwnedGamesChange(updatedList);

    if (selectedPlatformForAdd === "steam" && steamAccount?.username) {
      newGame = await syncSingleSteamGame(steamAccount.username, newGame);
      updatedList = mergeGamesList(ownedGames, [newGame]);
      onOwnedGamesChange(updatedList);
    } else {
      try {
        const r = await fetch(`/api/game/${item.id}`);
        if (r.ok) {
          const details = await r.json();
          newGame = {
            ...newGame,
            totalAchievements: details.totalAchievements || 0,
          };
          updatedList = mergeGamesList(ownedGames, [newGame]);
          onOwnedGamesChange(updatedList);
        }
      } catch {}
    }

    await persistGamesToSQLite([newGame]);

    setBannerMsg({
      type: "success",
      text: `"${item.name}" (${PLATFORM_META[selectedPlatformForAdd].shortName}) ajouté à votre bibliothèque !`,
    });
  };

  // Derived: Duplicate Groups
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, OwnedGame[]>();
    for (const g of ownedGames) {
      const norm = normalizeGameTitle(g.name);
      if (!norm) continue;
      const arr = groups.get(norm) || [];
      arr.push(g);
      groups.set(norm, arr);
    }
    const result: Array<{ title: string; games: OwnedGame[] }> = [];
    for (const [_, games] of groups.entries()) {
      const platforms = new Set(games.map((g) => g.platform));
      if (platforms.size > 1) {
        result.push({
          title: games[0].name,
          games,
        });
      }
    }
    return result;
  }, [ownedGames]);

  // Derived: Global Statistics
  const globalStats = useMemo(() => {
    const connectedAccounts = ALL_PLATFORMS.filter(
      (p) => !!accountProfile.accounts[p]
    );

    let totalGamesOwned = 0;
    let totalAchievementsUnlocked = 0;
    let totalCompletedGames = 0;
    let totalHours = 0;

    const localByPlatform: Record<
      string,
      { games: number; achievements: number; completed: number; hours: number }
    > = {};

    for (const p of ALL_PLATFORMS) {
      localByPlatform[p] = { games: 0, achievements: 0, completed: 0, hours: 0 };
    }

    for (const g of ownedGames) {
      const p = g.platform;
      if (!localByPlatform[p]) {
        localByPlatform[p] = { games: 0, achievements: 0, completed: 0, hours: 0 };
      }
      localByPlatform[p].games += 1;
      localByPlatform[p].achievements += g.unlockedCount || 0;
      if (g.totalAchievements > 0 && g.unlockedCount >= g.totalAchievements) {
        localByPlatform[p].completed += 1;
      }
      localByPlatform[p].hours += g.playtimeHours || 0;
    }

    const seenPlatforms = new Set<string>();

    for (const plat of ALL_PLATFORMS) {
      const acc = accountProfile.accounts[plat];
      if (!acc) continue;
      seenPlatforms.add(plat);

      const local = localByPlatform[plat] || {
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

    const gamesWithAch = ownedGames.filter((g) => g.totalAchievements > 0);
    const avgCompletion =
      gamesWithAch.length > 0
        ? Math.round(
            (gamesWithAch.reduce(
              (acc, g) =>
                acc + Math.min(1, (g.unlockedCount || 0) / g.totalAchievements),
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

  // Derived: Per-platform game counts
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

  // Derived: Epic-specific counts
  const epicCounts = useMemo(() => {
    const epicGames = ownedGames.filter((g) => g.platform === "epic");
    const withAch = epicGames.filter((g) => g.totalAchievements > 0).length;
    return {
      total: epicGames.length,
      withAch,
      noAch: epicGames.length - withAch,
    };
  }, [ownedGames]);

  // Derived: Filtered & Sorted Games
  const filteredGames = useMemo(() => {
    const targetPlatform =
      activePlatformTab !== "all" ? activePlatformTab : libPlatformFilter;

    const list = ownedGames.filter((g) => {
      if (activePlatformTab === "wishlist") {
        if (!wishlistIds.includes(g.appId)) return false;
      } else if (activePlatformTab === "collections") {
        if (selectedCollId) {
          const coll = collections.find((c) => c.id === selectedCollId);
          if (!coll || !coll.gameIds.includes(g.appId)) return false;
        }
      } else if (targetPlatform !== "all" && activePlatformTab !== "duplicates") {
        if (g.platform !== targetPlatform) {
          return false;
        }
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
    wishlistIds,
    collections,
    selectedCollId,
  ]);

  const displayName =
    steamAccount?.displayName || steamAccount?.username || "Joueur Steam";

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

      {/* Live Sync Progress Banner */}
      {syncProgressText && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3 text-xs text-sky-200">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-sky-400" />
          <span className="font-medium truncate">{syncProgressText}</span>
        </div>
      )}

      {/* Top Platform Navigation Tabs */}
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

        {/* Doublons Multiplateformes Tab */}
        <button
          onClick={() => setActivePlatformTab("duplicates")}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
            activePlatformTab === "duplicates"
              ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/40 shadow-lg"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
          }`}
        >
          <Copy className="h-3.5 w-3.5 text-purple-400" />
          <span>Doublons</span>
          {duplicateGroups.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activePlatformTab === "duplicates"
                  ? "bg-purple-900 text-purple-200 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {duplicateGroups.length}
            </span>
          )}
        </button>

        {/* Wishlist Tab */}
        <button
          onClick={() => {
            setActivePlatformTab("wishlist");
            setLibPlatformFilter("all");
          }}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
            activePlatformTab === "wishlist"
              ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40 shadow-lg"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
          }`}
        >
          <Heart className="h-3.5 w-3.5 text-rose-400" />
          <span>Liste d&apos;envies</span>
          {wishlistIds.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activePlatformTab === "wishlist"
                  ? "bg-rose-900 text-rose-200 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {wishlistIds.length}
            </span>
          )}
        </button>

        {/* Collections Tab */}
        <button
          onClick={() => {
            setActivePlatformTab("collections");
            setLibPlatformFilter("all");
          }}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
            activePlatformTab === "collections"
              ? "border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/40 shadow-lg"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
          }`}
        >
          <Folder className="h-3.5 w-3.5 text-indigo-400" />
          <span>Collections</span>
          {collections.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activePlatformTab === "collections"
                  ? "bg-indigo-900 text-indigo-200 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {collections.length}
            </span>
          )}
        </button>

        {/* SQLite Auth status badge */}
        <div className="ml-auto flex items-center gap-1.5 pl-2 shrink-0">
          {currentUser ? (
            <button
              onClick={onOpenAuthModal}
              title="Session SQLite active • Clés API chiffrées AES-256-GCM"
              className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>SQLite : @{currentUser.username}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Activer la base SQLite pour sécuriser vos clés API et synchroniser vos données"
              className="flex items-center gap-1.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20"
            >
              <Database className="h-3.5 w-3.5 text-sky-400" />
              <span>Base SQLite (Sécurisée)</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW A: GLOBAL OVERVIEW */}
      {activePlatformTab === "all" && (
        <OverviewPanel
          globalStats={globalStats}
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          onSelectPlatform={(plat) => {
            setActivePlatformTab(plat);
            setLibPlatformFilter(plat);
          }}
          onEditPlatform={openEditPlatform}
          onDisconnectPlatform={handleDisconnectPlatform}
          onSelectGame={onSelectGame}
        />
      )}

      {/* VIEW B: STEAM DEDICATED VIEW */}
      {activePlatformTab === "steam" && (
        <PlatformSteamPanel
          steamAccount={steamAccount}
          displayName={displayName}
          platformCounts={platformCounts}
          steamInput={steamInput}
          setSteamInput={setSteamInput}
          steamApiKey={steamApiKey}
          setSteamApiKey={setSteamApiKey}
          showApiKeyInput={showApiKeyInput}
          setShowApiKeyInput={setShowApiKeyInput}
          isSyncingSteam={isSyncingSteam}
          syncProgressText={syncProgressText}
          onConnectAndSyncSteam={handleConnectAndSyncSteam}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* VIEW C: XBOX LIVE DEDICATED VIEW */}
      {activePlatformTab === "xbox" && (
        <PlatformXboxPanel
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          xboxInput={xboxInput}
          setXboxInput={setXboxInput}
          xboxApiKey={xboxApiKey}
          setXboxApiKey={setXboxApiKey}
          showXboxApiKey={showXboxApiKey}
          setShowXboxApiKey={setShowXboxApiKey}
          isSyncingXbox={isSyncingXbox}
          onConnectAndSyncXbox={handleConnectAndSyncXbox}
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* VIEW D: EPIC GAMES DEDICATED VIEW */}
      {activePlatformTab === "epic" && (
        <PlatformEpicPanel
          accountProfile={accountProfile}
          epicCounts={epicCounts}
          epicInput={epicInput}
          setEpicInput={setEpicInput}
          epicCode={epicCode}
          setEpicCode={setEpicCode}
          showEpicCode={showEpicCode}
          setShowEpicCode={setShowEpicCode}
          isSyncingEpic={isSyncingEpic}
          syncProgressText={syncProgressText}
          libAchievementFilter={libAchievementFilter}
          setLibAchievementFilter={setLibAchievementFilter}
          onConnectAndSyncEpic={handleConnectAndSyncEpic}
          onScanEpicAchievements={handleScanEpicAchievements}
          onCleanEpicGames={() =>
            handleCleanEpicGames(epicCounts.noAch, epicCounts.withAch)
          }
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* VIEW E: GOG GALAXY DEDICATED VIEW */}
      {activePlatformTab === "gog" && (
        <PlatformGogPanel
          accountProfile={accountProfile}
          platformCounts={platformCounts}
          gogInput={gogInput}
          setGogInput={setGogInput}
          gogToken={gogToken}
          setGogToken={setGogToken}
          showGogToken={showGogToken}
          setShowGogToken={setShowGogToken}
          isSyncingGOG={isSyncingGOG}
          onConnectAndSyncGOG={handleConnectAndSyncGOG}
          openEditPlatform={openEditPlatform}
          handleDisconnectPlatform={handleDisconnectPlatform}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* VIEW F: CROSS-PLATFORM DUPLICATES VIEW */}
      {activePlatformTab === "duplicates" && (
        <DuplicatesPanel
          duplicateGroups={duplicateGroups}
          onSelectGame={onSelectGame}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* VIEW G: COLLECTIONS VIEW */}
      {activePlatformTab === "collections" && (
        <CollectionsPanel
          collections={collections}
          selectedCollId={selectedCollId}
          setSelectedCollId={setSelectedCollId}
          isCreatingColl={isCreatingColl}
          setIsCreatingColl={setIsCreatingColl}
          newCollName={newCollName}
          setNewCollName={setNewCollName}
          newCollDesc={newCollDesc}
          setNewCollDesc={setNewCollDesc}
          handleCreateCollection={handleCreateCollection}
          handleDeleteCollection={handleDeleteCollection}
          onBackToAll={() => {
            setActivePlatformTab("all");
            setLibPlatformFilter("all");
          }}
        />
      )}

      {/* 5. Owned Games Library ("Mes Jeux Possédés") */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-sky-400" />
              {activePlatformTab === "all"
                ? `Mes Jeux Possédés (${filteredGames.length}${ownedGames.length !== filteredGames.length ? ` / ${ownedGames.length}` : ""})`
                : activePlatformTab === "wishlist"
                ? `Ma Liste d'envies (${filteredGames.length})`
                : activePlatformTab === "collections"
                ? `Jeux de la collection (${filteredGames.length})`
                : activePlatformTab === "duplicates"
                ? `Tous les jeux détectés en doublons (${filteredGames.length})`
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
            {filteredGames.map((g) => (
              <LibraryGameCard
                key={`${g.platform}_${g.appId}`}
                game={g}
                steamAccount={steamAccount}
                activePlatformTab={activePlatformTab}
                selectedCollId={selectedCollId}
                wishlistIds={wishlistIds}
                collections={collections}
                onSelectGame={onSelectGame}
                onToggleWishlist={handleToggleWishlist}
                onOpenAddToCollection={setGameToAddToColl}
                onRemoveFromCollection={handleRemoveGameFromColl}
                onSyncGame={handleSyncGame}
                onRemoveGame={handleRemoveGame}
              />
            ))}
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
      <EditPlatformModal
        editingPlatform={editingPlatform}
        onClose={() => setEditingPlatform(null)}
        platForm={platForm}
        setPlatForm={setPlatForm}
        onSave={handleSavePlatformModal}
      />

      {/* Modal: Add Game to Owned Library or Bulk Import */}
      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
        selectedPlatformForAdd={selectedPlatformForAdd}
        setSelectedPlatformForAdd={setSelectedPlatformForAdd}
        addGameQuery={addGameQuery}
        handleSearchAddGame={handleSearchAddGame}
        isSearchingAdd={isSearchingAdd}
        addGameResults={addGameResults}
        ownedGames={ownedGames}
        handleAddGameToLibrary={handleAddGameToLibrary}
        bulkImportText={bulkImportText}
        setBulkImportText={setBulkImportText}
        handleBulkImport={handleBulkImport}
        isBulkImporting={isBulkImporting}
      />

      {/* Modal: Add Game to Collection */}
      {gameToAddToColl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-indigo-400" />
                Ajouter à une collection
              </h3>
              <button
                onClick={() => setGameToAddToColl(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Choisir une collection pour <strong>{gameToAddToColl.name}</strong> :
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {collections.map((c) => {
                const alreadyIn = c.gameIds.includes(gameToAddToColl.appId);
                return (
                  <button
                    key={c.id}
                    disabled={alreadyIn}
                    onClick={() => handleAddGameToColl(c.id, gameToAddToColl)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-left transition hover:border-indigo-500/50 disabled:opacity-50"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {alreadyIn ? "Déjà présent ✓" : "Ajouter +"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
