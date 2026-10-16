"use client";

import { useRouter } from "next/navigation";
import GameHeader from "@/components/GameHeader";
import ProgressTracker from "@/components/ProgressTracker";
import FilterToolbar from "@/components/FilterToolbar";
import AchievementItem from "@/components/AchievementItem";
import type { PlatformType } from "@/lib/types";
import { useUserData } from "@/context/UserDataContext";
import { useGameDetails } from "./hooks/useGameDetails";
import { useGameProgressActions } from "./hooks/useGameProgressActions";
import { useAchievementFilters } from "./hooks/useAchievementFilters";
import { GameClientLoading } from "./components/GameClientLoading";
import { GameClientError } from "./components/GameClientError";
import { GameSyncNotice } from "./components/GameSyncNotice";

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

  const owned = ownedGames.find((g) => g.appId === appId);
  const activePlatform: PlatformType =
    (owned?.platform as PlatformType) || "steam";

  const {
    game,
    progress,
    setProgress,
    isLoading,
    error,
    isSyncing,
    setIsSyncing,
    syncNotice,
    setSyncNotice,
  } = useGameDetails({
    appId,
    owned,
    activePlatform,
    currentUser,
    accountProfile,
    steamUser,
    upsertOwnedGameInMemoryAndDb,
  });

  const {
    handleSync,
    handleToggleAchievement,
    handleSaveNotes,
    handleResetProgress,
    handleToggleFavorite,
    handleToggleOwned,
  } = useGameProgressActions({
    game,
    owned,
    activePlatform,
    progress,
    setProgress,
    accountProfile,
    steamUser,
    currentUser,
    favorites,
    setFavorites,
    ownedGames,
    upsertOwnedGameInMemoryAndDb,
    setIsSyncing,
    setSyncNotice,
  });

  const {
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    revealSecrets,
    setRevealSecrets,
    displayedAchievements,
    counts,
  } = useAchievementFilters(game?.achievements, progress);

  if (isLoading) {
    return <GameClientLoading />;
  }

  if (error || !game) {
    return <GameClientError error={error} />;
  }

  return (
    <div className="space-y-6">
      <GameHeader
        game={game}
        isFavorite={favorites.includes(game.id)}
        onToggleFavorite={handleToggleFavorite}
        isOwned={ownedGames.some((g) => g.appId === game.id)}
        onToggleOwned={handleToggleOwned}
        onBackToLibrary={() => router.push("/")}
      />

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start space-y-5 lg:space-y-0">
        {/* Sticky Left Column on Desktop: Progress & Sync */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
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

          <GameSyncNotice notice={syncNotice} />
        </div>

        {/* Main Right Column on Desktop: Filters & Achievements List */}
        <div className="lg:col-span-8 space-y-4">
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

          <div className="space-y-2.5">
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
      </div>
    </div>
  );
}
