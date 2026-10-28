// app/components/HomeLibrarySection.tsx

import { useRouter } from "next/navigation";
import LibrarySection from "@/components/dashboard/library-section/LibrarySection";
import type { useHomePageController } from "../hooks/useHomePageController";

interface HomeLibrarySectionProps {
  readonly controller: ReturnType<typeof useHomePageController>;
}

export function HomeLibrarySection({ controller: c }: HomeLibrarySectionProps) {
  const router = useRouter();
  const { collectionsState: cs, platformSync: ps, addGameFlow: ag, stats, libraryFilters: lf } = c;

  return (
    <LibrarySection
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
    />
  );
}
