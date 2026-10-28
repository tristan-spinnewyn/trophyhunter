// app/game/[id]/GameClientPage.tsx
"use client";

import { useRouter } from "next/navigation";
import GameHeader from "@/components/game-header/GameHeader";
import FilterToolbar from "@/components/filter-toolbar/FilterToolbar";
import EpicAuthModal from "@/components/EpicAuthModal";
import { ActiveHuntPanel } from "@/components/hunting/ActiveHuntPanel";
import { useGameClientController } from "./hooks/useGameClientController";
import { GameClientLoading } from "./components/GameClientLoading";
import { GameClientError } from "./components/GameClientError";
import { GameClientSidebar } from "./components/GameClientSidebar";
import { AchievementsListSection } from "./components/AchievementsListSection";

export default function GameClientPage({ id }: { id: string }) {
  const router = useRouter();
  const c = useGameClientController(id);

  if (c.isLoading) return <GameClientLoading />;
  if (c.error || !c.game) return <GameClientError error={c.error} />;

  const hasAchievements = c.game.totalAchievements > 0 || c.game.achievements.length > 0;

  return (
    <div className="space-y-6">
      <GameHeader
        game={c.game}
        isFavorite={c.favorites.includes(c.game.id)}
        onToggleFavorite={c.handleToggleFavorite}
        isOwned={c.ownedGames.some((g) => g.appId === c.game?.id)}
        onToggleOwned={c.handleToggleOwned}
        gameStatus={c.owned?.status}
        onChangeGameStatus={c.handleChangeGameStatus}
        huntingMeta={hasAchievements ? c.huntingMeta : undefined}
        onSaveHuntingOverride={c.handleSaveHuntingOverride}
        onBackToLibrary={() => router.push("/")}
        playtimeHours={c.owned?.playtimeHours}
      />

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start space-y-5 lg:space-y-0">
        <GameClientSidebar
          game={c.game}
          progress={c.progress}
          onResetProgress={c.handleResetProgress}
          onSync={c.handleSync}
          isSyncing={c.isSyncing}
          activePlatform={c.activePlatform}
          accountProfile={c.accountProfile}
          steamUser={c.steamUser}
          openEpicAuthModal={c.openEpicAuthModal}
          syncNotice={c.syncNotice}
        />

        <div className="lg:col-span-8 space-y-4">
          {hasAchievements && (
            <>
              <ActiveHuntPanel
                pinnedAchievements={c.pinnedAchievements}
                unlockedIds={c.progress.unlockedIds}
                notes={c.progress.notes}
                onToggleUnlocked={c.handleToggleAchievement}
                onUnpin={c.handleTogglePinAchievement}
                onClearUnlocked={c.handleClearUnlockedPins}
                onClearAll={c.handleClearAllPins}
              />
              <FilterToolbar
                filter={c.filter}
                onFilterChange={c.setFilter}
                search={c.search}
                onSearchChange={c.setSearch}
                sort={c.sort}
                onSortChange={c.setSort}
                revealSecrets={c.revealSecrets}
                onToggleRevealSecrets={() => c.setRevealSecrets(!c.revealSecrets)}
                counts={c.counts}
              />
            </>
          )}

          <AchievementsListSection
            displayedAchievements={c.displayedAchievements}
            game={c.game}
            progress={c.progress}
            revealSecrets={c.revealSecrets}
            onToggleAchievement={c.handleToggleAchievement}
            onTogglePinAchievement={c.handleTogglePinAchievement}
            onSaveNotes={c.handleSaveNotes}
            onResetFilters={() => { c.setFilter("all"); c.setSearch(""); }}
          />
        </div>
      </div>

      <EpicAuthModal
        isOpen={c.isEpicAuthModalOpen}
        onClose={() => c.setIsEpicAuthModalOpen(false)}
        onSubmit={c.handleEpicAuthSubmit}
        gameName={c.game.name}
        isLoading={c.isSyncing}
        error={c.epicAuthModalError}
      />
    </div>
  );
}
