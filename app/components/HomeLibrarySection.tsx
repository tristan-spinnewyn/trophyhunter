// app/components/HomeLibrarySection.tsx

import { useRouter } from "next/navigation";
import LibrarySection from "@/components/library/section/LibrarySection";
import { useUserSettings } from "@/components/settings/useUserSettings";
import type { useHomePageController } from "../hooks/useHomePageController";
import type { GameDurations, PlaySession } from "@/lib/types";

interface HomeLibrarySectionProps {
  readonly controller: ReturnType<typeof useHomePageController>;
  readonly recentSessions?: readonly PlaySession[];
  /** How long the games ahead take to beat, keyed `platform_appId`. */
  readonly plannedDurations: Readonly<Record<string, GameDurations>>;
}

export function HomeLibrarySection({ controller: c, recentSessions, plannedDurations }: HomeLibrarySectionProps) {
  const router = useRouter();
  const { collectionsState: cs, platformSync: ps, addGameFlow: ag, stats, libraryFilters: lf } = c;
  const { settings } = useUserSettings();

  return (
    <LibrarySection
      isLoading={c.isLoadingCollection}
      activePlatformTab={c.activePlatformTab}
      filteredGames={lf.filteredGames}
      totalOwnedGamesCount={c.ownedGames.length}
      platformGameCount={stats.platformCounts[c.activePlatformTab] || 0}
      steamAccount={c.steamAccount}
      onOpenAddGame={() => ag.setIsAddGameOpen(true)}
      onAddApiKeyClick={() => router.push("/account")}
      libSearch={lf.libSearch}
      setLibSearch={lf.setLibSearch}
      libPlatformFilter={lf.libPlatformFilter}
      setLibPlatformFilter={lf.setLibPlatformFilter}
      libAchievementFilter={lf.libAchievementFilter}
      setLibAchievementFilter={lf.setLibAchievementFilter}
      libSortOrder={lf.libSortOrder}
      setLibSortOrder={lf.setLibSortOrder}
      selectedCollId={cs.selectedCollId}
      wishlistIds={cs.wishlistIds}
      collections={cs.collections}
      onSelectGame={(appId) => router.push(`/game/${appId}`)}
      onToggleWishlist={cs.handleToggleWishlist}
      onOpenAddToCollection={cs.setGameToAddToColl}
      onRemoveFromCollection={cs.handleRemoveGameFromColl}
      onSyncGame={ps.handleSyncGame}
      onRemoveGame={ps.handleRemoveGame}
      onUpdateGameStatus={ps.handleUpdateGameStatus}
      onPlayNext={ps.handlePlayNext}
      onRemoveFromQueue={ps.handleRemoveFromQueue}
      onReorderQueue={ps.handleReorderQueue}
      backlogDurations={plannedDurations}
      staleAfterWeeks={settings?.staleAfterWeeks}
      recentSessions={recentSessions}
    />
  );
}
