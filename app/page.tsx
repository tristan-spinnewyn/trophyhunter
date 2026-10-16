"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import GameHeader from "@/components/GameHeader";
import ProgressTracker from "@/components/ProgressTracker";
import FilterToolbar from "@/components/FilterToolbar";
import AchievementItem from "@/components/AchievementItem";
import SettingsModal from "@/components/SettingsModal";
import AccountDashboard from "@/components/AccountDashboard";
import AuthModal from "@/components/AuthModal";
import AuthGate from "@/components/AuthGate";
import type {
  GameDetails,
  FilterStatus,
  SortOrder,
  UserGameProgress,
  UserAccountProfile,
  OwnedGame,
  PlatformAccount,
  User as UserType,
} from "@/lib/types";

import {
  getGameProgress,
  saveGameProgress,
  toggleAchievementUnlocked,
  setAchievementNote,
  resetGameProgress,
  getFavoriteGames,
  toggleFavoriteGame,
  getRecentGames,
  getSavedSteamUser,
  getSavedSteamApiKey,
  getUserAccount,
  savePlatformAccount,
  getOwnedGames,
  upsertOwnedGames,
  removeOwnedGame,
  clearLegacyLocalStorage,
} from "@/lib/storage";
import {
  Trophy,
  Loader2,
  AlertCircle,
  Flame,
  Check,
  User,
  Gamepad2,
} from "lucide-react";

const FEATURED_GAMES = [
  {
    id: 1091500,
    name: "Cyberpunk 2077",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
    count: "45 succès",
  },
  {
    id: 1245620,
    name: "ELDEN RING",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
    count: "42 succès",
  },
  {
    id: 367520,
    name: "Hollow Knight",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
    count: "63 succès",
  },
  {
    id: 292030,
    name: "The Witcher 3",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
    count: "78 succès",
  },
  {
    id: 1086940,
    name: "Baldur's Gate 3",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
    count: "53 succès",
  },
  {
    id: 2050650,
    name: "Resident Evil 4",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg",
    count: "39 succès",
  },
  {
    id: 504230,
    name: "Celeste",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg",
    count: "32 succès",
  },
  {
    id: 105600,
    name: "Terraria",
    img: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg",
    count: "115 succès",
  },
];

export default function Home() {
  const [activeView, setActiveView] = useState<"game" | "account">("account");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("default");
  const [revealSecrets, setRevealSecrets] = useState<boolean>(false);

  // Storage & Account State
  const [progress, setProgress] = useState<UserGameProgress>({
    unlockedIds: [],
    notes: {},
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [steamUser, setSteamUser] = useState<string>("");
  const [accountProfile, setAccountProfile] = useState<UserAccountProfile>({
    displayName: "Chasseur de Trophées",
    accounts: {},
  });
  const [ownedGames, setOwnedGames] = useState<OwnedGame[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const refreshUserData = async () => {
    try {
      const res = await fetch("/api/user/sync");
      if (!res.ok) return;
      const syncData = await res.json();
      if (syncData?.games) {
        setOwnedGames(syncData.games);
      }
      if (syncData?.profile) {
        setAccountProfile(syncData.profile);
        if (syncData.profile.accounts?.steam?.username) {
          setSteamUser(syncData.profile.accounts.steam.username);
        }
      }
      if (Array.isArray(syncData?.favorites)) {
        setFavorites(syncData.favorites);
      }
    } catch (e) {
      console.error("Failed to refresh user data from SQLite:", e);
    }
  };

  // Check user session & load database data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          try {
            const localGames = getOwnedGames();
            const localAccount = getUserAccount();
            const hasLocalData =
              localGames.length > 0 ||
              (localAccount?.accounts && Object.keys(localAccount.accounts).length > 0);

            if (hasLocalData) {
              await handleSyncLocalToSQLite();
            }
          } catch (e) {
            console.error("Auto-migration check error:", e);
          }
          await refreshUserData();
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsCheckingAuth(false));

    setFavorites(getFavoriteGames());
    const savedSteam = getSavedSteamUser();
    setSteamUser(savedSteam);
    const savedAccount = getUserAccount();
    setAccountProfile(savedAccount);
    const savedOwned = getOwnedGames();
    setOwnedGames(savedOwned);
    const recents = getRecentGames();
    setRecentIds(recents);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setOwnedGames([]);
    setAccountProfile({
      displayName: "Chasseur de Trophées",
      accounts: {},
    });
    setFavorites([]);
    setProgress({ unlockedIds: [], notes: {} });
    setGame(null);
    setSelectedAppId(null);
    setActiveView("account");
  };

  const handleAuthSuccess = async (u: UserType) => {
    setCurrentUser(u);
    try {
      const localGames = getOwnedGames();
      const localAccount = getUserAccount();
      const hasLocalData =
        localGames.length > 0 ||
        (localAccount?.accounts && Object.keys(localAccount.accounts).length > 0);

      if (hasLocalData) {
        await handleSyncLocalToSQLite();
      }
    } catch (e) {
      console.error("Auto-sync local data to SQLite failed:", e);
    }
    await refreshUserData();
  };

  const handleSyncLocalToSQLite = async () => {
    const localProfile = getUserAccount();
    const localGames = getOwnedGames();
    const localFavorites = getFavoriteGames();
    const localApiKey = getSavedSteamApiKey();
    const progressMap: Record<string, any> = {};
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("trophyhunter_game_")) {
          try {
            progressMap[k] = JSON.parse(localStorage.getItem(k) || "{}");
          } catch {}
        }
      }
    }

    const payload = {
      profile: localProfile,
      games: localGames,
      favorites: localFavorites,
      steamApiKey: localApiKey || undefined,
      progress: progressMap,
    };

    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Erreur de synchronisation SQLite");
    }

    const data = await res.json();
    if (data?.profile) {
      setAccountProfile(data.profile);
    }

    // Purge legacy localStorage entries now that data is persisted in SQLite
    clearLegacyLocalStorage();
  };


  // Sync achievements from public Steam profile for the active game
  const handleSync = async () => {
    if (!steamUser) {
      setActiveView("account");
      return;
    }
    if (!game) return;

    setIsSyncing(true);
    setSyncNotice(null);

    try {
      const res = await fetch(
        `/api/sync?user=${encodeURIComponent(steamUser)}&appId=${game.id}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de la synchronisation.");
      }

      const unlockedTitles: string[] = data.unlockedTitles || [];
      const normalize = (s: string) =>
        s.replace(/[’']/g, "'").trim().toLowerCase();

      const matchedIds =
        data.unlockedIds && data.unlockedIds.length > 0
          ? data.unlockedIds
          : game.achievements
              .filter((a) =>
                unlockedTitles.some((t) => normalize(t) === normalize(a.name))
              )
              .map((a) => a.id);

      const updated: UserGameProgress = {
        ...progress,
        unlockedIds: matchedIds,
        lastPlayed: new Date().toISOString(),
      };
      saveGameProgress(game.id, updated, {
        name: game.name,
        headerImg: game.headerImg,
        totalAchievements: game.totalAchievements,
        platform: "steam",
      });
      setProgress(updated);
      setOwnedGames(getOwnedGames());
      setSyncNotice({
        type: "success",
        msg: `${matchedIds.length} succès synchronisés depuis le profil Steam de "${steamUser}" !`,
      });
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      setSyncNotice({
        type: "error",
        msg: err.message || "Erreur lors de la synchronisation.",
      });
      setTimeout(() => setSyncNotice(null), 7000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load a game by AppID and switch to Game View
  const loadGame = async (appId: number) => {
    setActiveView("game");
    setSelectedAppId(appId);
    setIsLoading(true);
    setError(null);
    setSearch("");
    setFilter("all");

    const owned = ownedGames.find((g) => g.appId === appId);
    let currentProgress = getGameProgress(appId);
    if (currentUser) {
      try {
        const plat = owned?.platform || "steam";
        const progRes = await fetch(`/api/user/progress?appId=${appId}&platform=${plat}`);
        if (progRes.ok) {
          const progData = await progRes.json();
          if (progData?.progress) {
            currentProgress = progData.progress;
          }
        }
      } catch {}
    }
    setProgress(currentProgress);

    const query = new URLSearchParams();
    if (owned?.name) query.set("name", owned.name);
    if (owned?.platform) query.set("platform", owned.platform);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    try {
      const res = await fetch(`/api/game/${appId}${queryString}`);
      if (!res.ok) {
        throw new Error("Impossible de récupérer les succès du jeu.");
      }
      const data: GameDetails = await res.json();
      setGame(data);
      setRecentIds(getRecentGames());

      // Update totalAchievements in ownedGames if this game is owned
      if (owned) {
        const nextOwned = upsertOwnedGames([
          {
            appId: data.id,
            name: data.name,
            headerImg: data.headerImg || owned.headerImg,
            platform: owned.platform || "steam",
            totalAchievements: data.totalAchievements,
            unlockedCount: currentProgress.unlockedIds.length,
            addedAt: new Date().toISOString(),
          },
        ]);
        setOwnedGames(nextOwned);
      }

      // Auto-sync from Steam profile if no achievements are checked yet
      const user = accountProfile.accounts.steam?.username || steamUser;
      if (user && currentProgress.unlockedIds.length === 0) {
        fetch(`/api/sync?user=${encodeURIComponent(user)}&appId=${appId}`)
          .then((r) => r.json())
          .then((syncData) => {
            if (syncData.success && syncData.unlockedTitles) {
              const normalize = (s: string) =>
                s.replace(/[’']/g, "'").trim().toLowerCase();
              const matched =
                syncData.unlockedIds && syncData.unlockedIds.length > 0
                  ? syncData.unlockedIds
                  : data.achievements
                      .filter((a) =>
                        syncData.unlockedTitles.some(
                          (t: string) => normalize(t) === normalize(a.name)
                        )
                      )
                      .map((a) => a.id);

              if (matched.length > 0) {
                const updated = {
                  ...currentProgress,
                  unlockedIds: matched,
                  lastPlayed: new Date().toISOString(),
                };
                saveGameProgress(appId, updated, {
                  name: data.name,
                  headerImg: data.headerImg,
                  totalAchievements: data.totalAchievements,
                  platform: "steam",
                });
                setProgress(updated);
                setOwnedGames(getOwnedGames());

                if (currentUser) {
                  fetch("/api/user/progress", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      appId,
                      platform: "steam",
                      progress: updated,
                    }),
                  }).catch(() => {});
                }

                setSyncNotice({
                  type: "success",
                  msg: `${matched.length} succès synchronisés automatiquement depuis votre profil Steam !`,
                });
                setTimeout(() => setSyncNotice(null), 5000);
              }
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle achievement checkbox
  const handleToggleAchievement = async (achId: string) => {
    if (!selectedAppId) return;
    const updated = toggleAchievementUnlocked(
      selectedAppId,
      achId,
      game
        ? {
            name: game.name,
            headerImg: game.headerImg,
            totalAchievements: game.totalAchievements,
          }
        : undefined
    );
    setProgress({ ...updated });
    setOwnedGames(getOwnedGames());

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: selectedAppId,
            platform: "steam",
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist progress to database:", err);
      }
    }
  };

  // Save custom note for achievement
  const handleSaveNotes = async (achId: string, noteText: string) => {
    if (!selectedAppId) return;
    const updated = setAchievementNote(selectedAppId, achId, noteText);
    setProgress({ ...updated });

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: selectedAppId,
            platform: "steam",
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist note to database:", err);
      }
    }
  };

  // Reset progress for this game
  const handleResetProgress = async () => {
    if (!selectedAppId) return;
    resetGameProgress(selectedAppId);
    setProgress({ unlockedIds: [], notes: {} });
    setOwnedGames(getOwnedGames());

    if (currentUser) {
      try {
        await fetch(`/api/user/progress?appId=${selectedAppId}&platform=steam`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to reset progress in database:", err);
      }
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!selectedAppId) return;
    const isFav = favorites.includes(selectedAppId);
    const updated = toggleFavoriteGame(selectedAppId);
    setFavorites(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: selectedAppId,
            platform: "steam",
            isFavorite: !isFav,
          }),
        });
      } catch (err) {
        console.error("Failed to persist favorite to database:", err);
      }
    }
  };

  // Toggle Owned status for the currently active game
  const handleToggleOwnedActiveGame = async () => {
    if (!game) return;
    const exists = ownedGames.some((g) => g.appId === game.id);
    if (exists) {
      const next = removeOwnedGame(game.id);
      setOwnedGames(next);
      if (currentUser) {
        try {
          await fetch(`/api/user/games?appId=${game.id}&platform=steam`, {
            method: "DELETE",
          });
        } catch (err) {
          console.error("Failed to remove game from database:", err);
        }
      }
    } else {
      const newGame: OwnedGame = {
        appId: game.id,
        name: game.name,
        headerImg: game.headerImg,
        platform: "steam",
        totalAchievements: game.totalAchievements,
        unlockedCount: progress.unlockedIds.length,
        addedAt: new Date().toISOString(),
        source: "manual",
      };
      const next = upsertOwnedGames([newGame]);
      setOwnedGames(next);
      if (currentUser) {
        try {
          await fetch("/api/user/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game: newGame }),
          });
        } catch (err) {
          console.error("Failed to add game to database:", err);
        }
      }
    }
  };

  // Calculate counts for filters
  const counts = useMemo(() => {
    if (!game)
      return { all: 0, locked: 0, unlocked: 0, missable: 0, hidden: 0 };
    const all = game.achievements.length;
    const unlocked = game.achievements.filter((a) =>
      progress.unlockedIds.includes(a.id)
    ).length;
    const locked = all - unlocked;
    const missable = game.achievements.filter((a) => a.missable).length;
    const hidden = game.achievements.filter((a) => a.hidden).length;

    return { all, locked, unlocked, missable, hidden };
  }, [game, progress.unlockedIds]);

  // Filter and sort achievements
  const displayedAchievements = useMemo(() => {
    if (!game) return [];

    let list = [...game.achievements];

    if (filter === "locked") {
      list = list.filter((a) => !progress.unlockedIds.includes(a.id));
    } else if (filter === "unlocked") {
      list = list.filter((a) => progress.unlockedIds.includes(a.id));
    } else if (filter === "missable") {
      list = list.filter((a) => a.missable);
    } else if (filter === "hidden") {
      list = list.filter((a) => a.hidden);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.desc.toLowerCase().includes(q) ||
          (progress.notes[a.id] &&
            progress.notes[a.id].toLowerCase().includes(q))
      );
    }

    if (sort === "rarity-asc") {
      list.sort((a, b) => a.percent - b.percent);
    } else if (sort === "rarity-desc") {
      list.sort((a, b) => b.percent - a.percent);
    } else if (sort === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }

    return list;
  }, [game, filter, search, sort, progress]);

  // Loading state while checking authentication session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30">
          <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
        </div>
        <p className="text-xs text-slate-400">Vérification de la session sécurisée...</p>
      </div>
    );
  }

  // Authentication requirement gate: user must log in or register to access TrophyHunter
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          onSelectGame={loadGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          favorites={favorites}
          activeView={activeView}
          onChangeView={setActiveView}
          accountProfile={accountProfile}
          ownedCount={0}
          currentUser={null}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <AuthGate onAuthSuccess={handleAuthSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onSelectGame={loadGame}
        onOpenSettings={() => setIsSettingsOpen(true)}
        favorites={favorites}
        activeView={activeView}
        onChangeView={setActiveView}
        accountProfile={accountProfile}
        ownedCount={ownedGames.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />


      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* Top Mode Switch Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveView("account")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeView === "account"
                ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Mon Compte, Plateformes & Bibliothèque</span>
          </button>

          {game && (
            <button
              onClick={() => setActiveView("game")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
                activeView === "game"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span className="truncate max-w-[180px] sm:max-w-xs">
                {game.name} ({progress.unlockedIds.length}/
                {game.totalAchievements})
              </span>
            </button>
          )}
        </div>

        {/* VIEW 1: ACCOUNT, MULTI-PLATFORM STATS & OWNED GAMES LIBRARY */}
        {activeView === "account" && (
          <div className="space-y-8">
            <AccountDashboard
              accountProfile={accountProfile}
              ownedGames={ownedGames}
              onAccountChange={setAccountProfile}
              onOwnedGamesChange={setOwnedGames}
              onSelectGame={loadGame}
              onSteamUserChange={setSteamUser}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthOpen(true)}
            />


            {/* Quick Selection Grid for Popular Games */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-400" />
                  Jeux populaires à explorer
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FEATURED_GAMES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadGame(item.id)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-left transition hover:border-sky-500/60 hover:shadow-xl hover:shadow-sky-500/10"
                  >
                    <div className="h-28 w-full overflow-hidden bg-slate-950">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-bold text-white group-hover:text-sky-400">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.count}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE GAME CHECKLIST & GUIDES */}
        {activeView === "game" && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Récupération des succès en français...
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Extraction des noms officiels, icônes, descriptions et guides
                  pas-à-pas.
                </p>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  Oups ! Une erreur est survenue
                </h3>
                <p className="text-xs text-rose-300">{error}</p>
                <button
                  onClick={() => selectedAppId && loadGame(selectedAppId)}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Active Game View */}
            {!isLoading && !error && game && (
              <div className="space-y-4">
                <GameHeader
                  game={game}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isOwned={ownedGames.some((g) => g.appId === game.id)}
                  onToggleOwned={handleToggleOwnedActiveGame}
                  onBackToLibrary={() => setActiveView("account")}
                />

                {/* Sync Notification Banner */}
                {syncNotice && (
                  <div
                    className={`flex items-center gap-2 rounded-2xl p-3 text-xs border ${
                      syncNotice.type === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {syncNotice.type === "success" ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    <span className="flex-1 font-medium">{syncNotice.msg}</span>
                  </div>
                )}

                {/* Platinum Progress Tracker */}
                <ProgressTracker
                  total={game.totalAchievements}
                  unlockedCount={progress.unlockedIds.length}
                  onReset={handleResetProgress}
                  onSync={handleSync}
                  isSyncing={isSyncing}
                  hasSteamUser={!!steamUser}
                />

                {/* Filter and Search Bar */}
                <FilterToolbar
                  filter={filter}
                  onFilterChange={setFilter}
                  search={search}
                  onSearchChange={setSearch}
                  sort={sort}
                  onSortChange={setSort}
                  revealSecrets={revealSecrets}
                  onToggleRevealSecrets={() => setRevealSecrets(!revealSecrets)}
                  counts={counts}
                />

                {/* Achievement List */}
                <div className="space-y-2.5 pt-1">
                  {displayedAchievements.length > 0 ? (
                    displayedAchievements.map((ach) => (
                      <AchievementItem
                        key={ach.id}
                        achievement={ach}
                        gameName={game.name}
                        gameId={game.id}
                        isUnlocked={progress.unlockedIds.includes(ach.id)}
                        notes={progress.notes[ach.id] || ""}
                        revealSecret={revealSecrets}
                        onToggleUnlocked={() => handleToggleAchievement(ach.id)}
                        onSaveNotes={(noteText) =>
                          handleSaveNotes(ach.id, noteText)
                        }
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 space-y-2">
                      <p className="text-sm font-medium">
                        Aucun succès ne correspond à ce filtre.
                      </p>
                      <button
                        onClick={() => {
                          setFilter("all");
                          setSearch("");
                        }}
                        className="text-xs text-sky-400 underline hover:text-sky-300"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* If no game selected in "game" view, guide back to account/library */}
            {!isLoading && !error && !game && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-3">
                <Gamepad2 className="h-10 w-10 text-sky-400 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  Aucun jeu sélectionné
                </h3>
                <p className="text-xs text-slate-400">
                  Choisissez un jeu depuis votre bibliothèque ou utilisez la
                  barre de recherche en haut.
                </p>
                <button
                  onClick={() => setActiveView("account")}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                >
                  Ouvrir Mon Compte & Ma Bibliothèque
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={() => {
          setProgress({ unlockedIds: [], notes: {} });
          setFavorites([]);
          setOwnedGames([]);
        }}
        onSteamUserSaved={(u) => setSteamUser(u)}
      />

      {/* Auth Modal (SQLite) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSyncLocalData={handleSyncLocalToSQLite}
      />
    </div>
  );

}
