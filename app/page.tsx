// app/page.tsx

"use client";

import FeedbackBanners from "@/components/ui/FeedbackBanners";
import LibraryNavTabs from "@/components/library/LibraryNavTabs";
import { LibraryHeaderBanner } from "@/components/library/LibraryHeaderBanner";
import { FeaturedGamesSection } from "@/components/library/FeaturedGamesSection";
import { useHomePageController } from "./hooks/useHomePageController";
import { HomeContextPanels } from "./components/HomeContextPanels";
import { HomeLibrarySection } from "./components/HomeLibrarySection";
import { HomeModalsContainer } from "./components/HomeModalsContainer";
import type { LibraryTab } from "@/lib/library/library-filters";

/** Game Pass and duplicates have their own panel; listing the whole collection under them is noise. */
function showsGameList(tab: LibraryTab): boolean {
  return tab !== "gamepass" && tab !== "duplicates";
}

export default function HomePage() {
  const c = useHomePageController();

  return (
    <div className="space-y-6">
      <LibraryHeaderBanner
        ownedGamesCount={c.ownedGames.length}
        onOpenAddGame={() => c.addGameFlow.setIsAddGameOpen(true)}
        trackingSummary={c.trackingSummary}
      />

      <FeedbackBanners
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

      {showsGameList(c.activePlatformTab) && <HomeLibrarySection controller={c} />}

      {c.ownedGames.length === 0 && <FeaturedGamesSection ownedGames={c.ownedGames} />}

      <HomeModalsContainer controller={c} />
    </div>
  );
}
