// app/components/HomeContextPanels.tsx

import { useRouter } from "next/navigation";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import GamePassPanel from "@/components/dashboard/GamePassPanel";
import type { LibraryTab } from "@/lib/library/library-filters";
import type { CollectionWithGames, OwnedGame, PlatformType } from "@/lib/types";
import type { GamePassCatalogItem } from "@/lib/gamepass/gamepass.types";

interface HomeContextPanelsProps {
  readonly activePlatformTab: LibraryTab;
  readonly ownedGames: readonly OwnedGame[];
  readonly wishlistIds: readonly number[];
  readonly collections: CollectionWithGames[];
  readonly selectedCollId: string | null;
  readonly setSelectedCollId: (id: string | null) => void;
  readonly isCreatingColl: boolean;
  readonly setIsCreatingColl: (val: boolean) => void;
  readonly newCollName: string;
  readonly setNewCollName: (val: string) => void;
  readonly newCollDesc: string;
  readonly setNewCollDesc: (val: string) => void;
  readonly handleCreateCollection: () => Promise<void>;
  readonly handleDeleteCollection: (collId: string) => Promise<void>;
  readonly duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  readonly onAddGamePassToXbox: (item: GamePassCatalogItem) => Promise<void>;
  readonly onToggleWishlist: (appId: number, platform: PlatformType) => Promise<void>;
}

export function HomeContextPanels({
  activePlatformTab,
  ownedGames,
  wishlistIds,
  collections,
  selectedCollId,
  setSelectedCollId,
  isCreatingColl,
  setIsCreatingColl,
  newCollName,
  setNewCollName,
  newCollDesc,
  setNewCollDesc,
  handleCreateCollection,
  handleDeleteCollection,
  duplicateGroups,
  onAddGamePassToXbox,
  onToggleWishlist,
}: HomeContextPanelsProps) {
  const router = useRouter();

  if (activePlatformTab === "gamepass") {
    return (
      <GamePassPanel
        ownedGames={ownedGames}
        wishlistIds={wishlistIds}
        onAddGameToXbox={onAddGamePassToXbox}
        onToggleWishlist={onToggleWishlist}
        onSelectGame={(appId, name) =>
          router.push(`/game/${appId}?name=${encodeURIComponent(name)}&platform=xbox`)
        }
      />
    );
  }

  if (activePlatformTab === "collections") {
    return (
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
      />
    );
  }

  if (activePlatformTab === "duplicates") {
    return (
      <DuplicatesPanel
        duplicateGroups={duplicateGroups}
        onSelectGame={(appId) => router.push(`/game/${appId}`)}
      />
    );
  }

  return null;
}
