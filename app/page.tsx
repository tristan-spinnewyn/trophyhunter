// app/page.tsx

"use client";

import { useRouter } from "next/navigation";
import FeedbackToasts from "@/components/ui/FeedbackToasts";
import LibraryNavTabs from "@/components/library/LibraryNavTabs";
import { LibraryHeaderBanner } from "@/components/library/LibraryHeaderBanner";
import { FeaturedGamesSection } from "@/components/library/FeaturedGamesSection";
import { YearGoalsSummary } from "@/components/goals/YearGoalsSummary";
import { useYearGoals } from "@/components/goals/useYearGoals";
import { RecentPlayPanel } from "@/components/library/RecentPlayPanel";
import { PriceReachedNotice } from "@/components/library/wishlist/PriceReachedNotice";
import { useRecentPlaySessions } from "@/components/library/hooks/useRecentPlaySessions";
import { usePlannedGameDurations } from "@/components/library/hooks/usePlannedGameDurations";
import { TonightPickPanel } from "@/components/library/tonight/TonightPickPanel";
import { PACE_WINDOW_DAYS } from "@/lib/library/backlog-estimate";
import { recentWeekStart, sessionsSince } from "@/lib/library/session-feed";
import { useHomePageController } from "./hooks/useHomePageController";
import { HomeContextPanels } from "./components/HomeContextPanels";
import { HomeLibrarySection } from "./components/HomeLibrarySection";
import { HomeModalsContainer } from "./components/HomeModalsContainer";
import type { LibraryTab } from "@/lib/library/library-filters";
import { ALL_PLATFORMS } from "@/lib/platforms";

/** Game Pass and duplicates have their own panel; listing the whole collection under them is noise. */
function showsGameList(tab: LibraryTab): boolean {
  return tab !== "gamepass" && tab !== "duplicates";
}

export default function HomePage() {
  const c = useHomePageController();
  const currentYear = new Date().getUTCFullYear();
  const { goals } = useYearGoals(currentYear, Boolean(c.currentUser));
  const router = useRouter();
  // Loaded once for the pace window; the weekly panel keeps the last seven days.
  const recentSessions = useRecentPlaySessions(Boolean(c.currentUser), { days: PACE_WINDOW_DAYS });
  const plannedDurations = usePlannedGameDurations(c.ownedGames, Boolean(c.currentUser));

  return (
    <div className="space-y-6">
      <LibraryHeaderBanner
        ownedGamesCount={c.ownedGames.length}
        isLoading={c.isLoadingCollection}
        onOpenAddGame={() => c.addGameFlow.setIsAddGameOpen(true)}
        trackingSummary={c.trackingSummary}
        platforms={ALL_PLATFORMS.filter((p) => (c.stats.platformCounts[p] ?? 0) > 0)}
      />

      <PriceReachedNotice ownedGames={c.ownedGames} isSignedIn={Boolean(c.currentUser)} />

      <YearGoalsSummary year={currentYear} goals={goals} onOpenYear={() => router.push("/annee")} />

      <RecentPlayPanel sessions={sessionsSince(recentSessions, recentWeekStart(new Date()))} onSelectGame={(appId) => router.push(`/game/${appId}`)} />

      <TonightPickPanel
        games={c.ownedGames}
        durations={plannedDurations}
        onSelectGame={(appId) => router.push(`/game/${appId}`)}
        onStartGame={(game) => c.platformSync.handleUpdateGameStatus(game.appId, game.platform, "in-progress")}
      />

      <FeedbackToasts
        bannerMsg={c.bannerMsg}
        onDismissBanner={() => c.setBannerMsg(null)}
        syncProgressText={c.platformSync.syncProgressText}
      />

      <LibraryNavTabs
        activePlatformTab={c.activePlatformTab}
        onSelectTab={c.handleSelectTab}
        ownedGamesCount={c.ownedGames.length}
        platformCounts={c.stats.platformCounts}
        accountProfile={c.accountProfile}
        duplicateCount={c.stats.duplicateGroups.length}
        wishlistCount={c.collectionsState.wishlistIds.length}
        collectionsCount={c.collectionsState.collections.length}
      />

      <HomeContextPanels
        activePlatformTab={c.activePlatformTab}
        ownedGames={c.ownedGames}
        wishlistIds={c.collectionsState.wishlistIds}
        collections={c.collectionsState.collections}
        selectedCollId={c.collectionsState.selectedCollId}
        setSelectedCollId={c.collectionsState.setSelectedCollId}
        isCreatingColl={c.collectionsState.isCreatingColl}
        setIsCreatingColl={c.collectionsState.setIsCreatingColl}
        newCollName={c.collectionsState.newCollName}
        setNewCollName={c.collectionsState.setNewCollName}
        newCollDesc={c.collectionsState.newCollDesc}
        setNewCollDesc={c.collectionsState.setNewCollDesc}
        handleCreateCollection={c.collectionsState.handleCreateCollection}
        handleDeleteCollection={c.collectionsState.handleDeleteCollection}
        duplicateGroups={c.stats.duplicateGroups}
        onAddGamePassToXbox={c.handleAddGamePassToXbox}
        onToggleWishlist={c.collectionsState.handleToggleWishlist}
      />

      {showsGameList(c.activePlatformTab) && <HomeLibrarySection controller={c} recentSessions={recentSessions} plannedDurations={plannedDurations} />}

      {!c.isLoadingCollection && c.ownedGames.length === 0 && <FeaturedGamesSection ownedGames={c.ownedGames} />}

      <HomeModalsContainer controller={c} />
    </div>
  );
}
