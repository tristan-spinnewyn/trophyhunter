"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GameHeader from "@/components/GameHeader";
import ProgressTracker from "@/components/ProgressTracker";
import FilterToolbar from "@/components/FilterToolbar";
import AchievementItem from "@/components/AchievementItem";
import type {
  GameDetails,
  FilterStatus,
  SortOrder,
  UserGameProgress,
} from "@/lib/types";
import { useUserData } from "@/context/UserDataContext";
import { isUnsplashPlaceholder } from "@/lib/epic-codenames";
import { Loader2, AlertCircle, Check, ArrowLeft } from "lucide-react";

export default function GameClientPage({ id }: { id: string }) {
  const router = useRouter();
  const appId = parseInt(id, 10);

  const {
    currentUser,
    ownedGames,
    accountProfile,
    steamUser,
    favorites,
    setFavorites,
    upsertOwnedGameInMemoryAndDb,
  } = useUserData();

  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("default");
  const [revealSecrets, setRevealSecrets] = useState<boolean>(false);

  // Progress
  const [progress, setProgress] = useState<UserGameProgress>({
    unlockedIds: [],
    notes: {},
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const owned = ownedGames.find((g) => g.appId === appId);
  const activePlatform = owned?.platform || "steam";

  // Load game & user progress
  useEffect(() => {
    if (isNaN(appId)) {
      setError("Identifiant de jeu invalide.");
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchData() {
      let currentProgress: UserGameProgress = { unlockedIds: [], notes: {} };

      if (currentUser) {
        try {
          const progRes = await fetch(
            `/api/user/progress?appId=${appId}&platform=${activePlatform}`
          );
          if (progRes.ok) {
            const progData = await progRes.json();
            if (progData?.progress) {
              currentProgress = progData.progress;
            }
          }
        } catch {}
      }

      if (isCancelled) return;
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
        if (isCancelled) return;
        setGame(data);

        // Update total achievements if owned
        if (owned) {
          const unlockedCount = Math.max(
            owned.unlockedCount || 0,
            currentProgress.unlockedIds.length
          );
          await upsertOwnedGameInMemoryAndDb({
            ...owned,
            appId: data.id,
            name: owned.name || data.name,
            headerImg:
              !isUnsplashPlaceholder(owned.headerImg)
                ? owned.headerImg
                : data.headerImg || owned.headerImg,
            platform: activePlatform,
            totalAchievements: data.totalAchievements,
            unlockedCount,
          });
        }

        // Auto-sync Steam if Steam game and 0 checked achievements
        const user = accountProfile.accounts.steam?.username || steamUser;
        if (
          activePlatform === "steam" &&
          user &&
          currentProgress.unlockedIds.length === 0
        ) {
          fetch(`/api/sync?user=${encodeURIComponent(user)}&appId=${appId}`)
            .then((r) => r.json())
            .then(async (syncData) => {
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

                if (matched.length > 0 && !isCancelled) {
                  const updated: UserGameProgress = {
                    ...currentProgress,
                    unlockedIds: matched,
                    lastPlayed: new Date().toISOString(),
                  };
                  setProgress(updated);

                  await upsertOwnedGameInMemoryAndDb({
                    appId,
                    name: data.name,
                    headerImg: data.headerImg,
                    platform: "steam",
                    totalAchievements: data.totalAchievements,
                    unlockedCount: matched.length,
                    addedAt: owned?.addedAt || new Date().toISOString(),
                  });

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
                    msg: `${matched.length} succès synchronisés automatiquement depuis Steam !`,
                  });
                  setTimeout(() => setSyncNotice(null), 5000);
                }
              }
            })
            .catch(() => {});
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Erreur lors du chargement.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [appId, activePlatform, currentUser?.id]);

  // Sync achievements manually
  const handleSync = async () => {
    if (!game) return;

    if (activePlatform === "epic") {
      const epicAccount = accountProfile.accounts.epic;
      if (!epicAccount) {
        setSyncNotice({
          type: "error",
          msg: "Veuillez lier votre compte Epic Games dans l'onglet Comptes.",
        });
        return;
      }

      setIsSyncing(true);
      setSyncNotice(null);

      try {
        const res = await fetch(
          `/api/sync?platform=epic&appId=${game.id}&name=${encodeURIComponent(
            game.name
          )}&user=${encodeURIComponent(epicAccount.username || "")}`
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Échec de la synchronisation Epic Games.");
        }

        const normalize = (s: string) =>
          s.replace(/[’']/g, "'").trim().toLowerCase();
        const unlockedTitles: string[] = data.unlockedTitles || [];
        const matched = game.achievements
          .filter((a) =>
            unlockedTitles.some((t) => normalize(t) === normalize(a.name))
          )
          .map((a) => a.id);

        const newUnlockedIds = Array.from(
          new Set([...progress.unlockedIds, ...matched])
        );

        const updatedProgress: UserGameProgress = {
          ...progress,
          unlockedIds: newUnlockedIds,
          lastPlayed: new Date().toISOString(),
        };

        setProgress(updatedProgress);

        if (owned) {
          await upsertOwnedGameInMemoryAndDb({
            ...owned,
            unlockedCount: Math.max(
              owned.unlockedCount || 0,
              newUnlockedIds.length
            ),
          });
        }

        setSyncNotice({
          type: "success",
          msg: `Synchronisation Epic réussie : ${matched.length} succès reconnus.`,
        });
      } catch (err: any) {
        setSyncNotice({
          type: "error",
          msg: err.message || "Erreur de synchronisation Epic Games.",
        });
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Default: Steam sync
    const user = accountProfile.accounts.steam?.username || steamUser;
    if (!user) {
      setSyncNotice({
        type: "error",
        msg: "Veuillez configurer votre pseudo ou SteamID dans vos comptes.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);

    try {
      const res = await fetch(
        `/api/sync?user=${encodeURIComponent(user)}&appId=${game.id}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Échec de la synchronisation Steam.");
      }

      const normalize = (s: string) =>
        s.replace(/[’']/g, "'").trim().toLowerCase();
      const matched =
        data.unlockedIds && data.unlockedIds.length > 0
          ? data.unlockedIds
          : game.achievements
              .filter((a) =>
                data.unlockedTitles.some(
                  (t: string) => normalize(t) === normalize(a.name)
                )
              )
              .map((a) => a.id);

      const updatedProgress: UserGameProgress = {
        ...progress,
        unlockedIds: matched,
        lastPlayed: new Date().toISOString(),
      };
      setProgress(updatedProgress);

      if (owned) {
        await upsertOwnedGameInMemoryAndDb({
          ...owned,
          unlockedCount: matched.length,
        });
      }

      if (currentUser) {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: "steam",
            progress: updatedProgress,
          }),
        });
      }

      setSyncNotice({
        type: "success",
        msg: `Synchronisation réussie : ${matched.length}/${game.totalAchievements} succès débloqués !`,
      });
    } catch (err: any) {
      setSyncNotice({
        type: "error",
        msg: err.message || "Erreur lors de la synchronisation.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle achievement checkbox
  const handleToggleAchievement = async (achId: string) => {
    if (!game) return;
    const isCurrentlyUnlocked = progress.unlockedIds.includes(achId);
    const nextUnlockedIds = isCurrentlyUnlocked
      ? progress.unlockedIds.filter((id) => id !== achId)
      : [...progress.unlockedIds, achId];

    const updated: UserGameProgress = {
      ...progress,
      unlockedIds: nextUnlockedIds,
      lastPlayed: new Date().toISOString(),
    };
    setProgress(updated);

    if (owned || game) {
      await upsertOwnedGameInMemoryAndDb({
        appId: game.id,
        name: owned?.name || game.name,
        headerImg: owned?.headerImg || game.headerImg || "",
        platform: activePlatform,
        totalAchievements: game.totalAchievements,
        unlockedCount: nextUnlockedIds.length,
        playtimeHours: owned?.playtimeHours,
        lastPlayed: updated.lastPlayed,
        addedAt: owned?.addedAt || new Date().toISOString(),
        source: owned?.source || "manual",
      });
    }

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist progress:", err);
      }
    }
  };

  // Save notes
  const handleSaveNotes = async (achId: string, noteText: string) => {
    if (!game) return;
    const nextNotes = { ...progress.notes };
    if (!noteText.trim()) {
      delete nextNotes[achId];
    } else {
      nextNotes[achId] = noteText.trim();
    }
    const updated: UserGameProgress = {
      ...progress,
      notes: nextNotes,
    };
    setProgress(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            progress: updated,
          }),
        });
      } catch (err) {
        console.error("Failed to persist note:", err);
      }
    }
  };

  // Reset progress
  const handleResetProgress = async () => {
    if (!game) return;
    setProgress({ unlockedIds: [], notes: {} });

    if (owned) {
      await upsertOwnedGameInMemoryAndDb({
        ...owned,
        unlockedCount: 0,
      });
    }

    if (currentUser) {
      try {
        await fetch(
          `/api/user/progress?appId=${game.id}&platform=${activePlatform}`,
          { method: "DELETE" }
        );
      } catch {}
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!game) return;
    const isFav = favorites.includes(game.id);
    const updated = isFav
      ? favorites.filter((id) => id !== game.id)
      : [...favorites, game.id];
    setFavorites(updated);

    if (currentUser) {
      try {
        await fetch("/api/user/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.id,
            platform: activePlatform,
            isFavorite: !isFav,
          }),
        });
      } catch {}
    }
  };

  // Toggle owned
  const handleToggleOwned = async () => {
    if (!game) return;
    const isCurrentlyOwned = ownedGames.some((g) => g.appId === game.id);
    if (isCurrentlyOwned) {
      if (currentUser) {
        await fetch(
          `/api/user/games?appId=${game.id}&platform=${activePlatform}`,
          { method: "DELETE" }
        );
      }
    } else {
      await upsertOwnedGameInMemoryAndDb({
        appId: game.id,
        name: game.name,
        headerImg: game.headerImg,
        platform: activePlatform,
        totalAchievements: game.totalAchievements,
        unlockedCount: progress.unlockedIds.length,
        addedAt: new Date().toISOString(),
        source: "manual",
      });
    }
  };

  // Filtered and sorted achievements
  const displayedAchievements = useMemo(() => {
    if (!game?.achievements) return [];
    return game.achievements
      .filter((ach) => {
        const isUnlocked = progress.unlockedIds.includes(ach.id);
        if (filter === "unlocked" && !isUnlocked) return false;
        if (filter === "locked" && isUnlocked) return false;
        if (filter === "missable" && !ach.missable) return false;
        if (filter === "hidden" && !ach.hidden) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const nameMatch = ach.name.toLowerCase().includes(q);
          const descMatch = (ach.desc || "").toLowerCase().includes(q);
          const noteMatch = (progress.notes[ach.id] || "")
            .toLowerCase()
            .includes(q);
          if (!nameMatch && !descMatch && !noteMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "rarity-asc") return a.percent - b.percent;
        if (sort === "rarity-desc") return b.percent - a.percent;
        if (sort === "name-asc") return a.name.localeCompare(b.name, "fr");
        return 0;
      });
  }, [game, progress, filter, search, sort]);

  const counts = useMemo(() => {
    if (!game?.achievements) {
      return { all: 0, locked: 0, unlocked: 0, missable: 0, hidden: 0 };
    }
    const all = game.achievements.length;
    const unlocked = progress.unlockedIds.length;
    const missable = game.achievements.filter((a) => a.missable).length;
    const hidden = game.achievements.filter((a) => a.hidden).length;
    return {
      all,
      unlocked,
      locked: Math.max(0, all - unlocked),
      missable,
      hidden,
    };
  }, [game, progress]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30">
          <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
        </div>
        <h3 className="text-base font-bold text-white">
          Récupération des succès en français...
        </h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Extraction des noms officiels, icônes, descriptions et guides pas-à-pas.
        </p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-4 my-8">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">
          Oups ! Une erreur est survenue
        </h3>
        <p className="text-xs text-rose-300">{error || "Jeu introuvable"}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Retour à ma bibliothèque</span>
        </Link>
      </div>

      <GameHeader
        game={game}
        isFavorite={favorites.includes(game.id)}
        onToggleFavorite={handleToggleFavorite}
        isOwned={ownedGames.some((g) => g.appId === game.id)}
        onToggleOwned={handleToggleOwned}
        onBackToLibrary={() => router.push("/")}
      />

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

      <ProgressTracker
        total={game.totalAchievements}
        unlockedCount={progress.unlockedIds.length}
        onReset={handleResetProgress}
        onSync={handleSync}
        isSyncing={isSyncing}
        platform={activePlatform}
        platformConnected={
          activePlatform === "epic"
            ? !!accountProfile.accounts.epic
            : !!steamUser
        }
        hasSteamUser={!!steamUser}
      />

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

      {/* Achievement list */}
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
              onSaveNotes={(noteText) => handleSaveNotes(ach.id, noteText)}
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
  );
}
