// components/library/hooks/useLibraryFilters.types.ts

import type { OwnedGame, PlatformType, CollectionWithGames } from "@/lib/types";
import type { LibraryTab } from "@/lib/library/library-filters";


export interface UseLibraryFiltersProps {
  ownedGames: OwnedGame[];
  activePlatformTab: LibraryTab;
  wishlistIds: number[];
  collections: CollectionWithGames[];
  selectedCollId: string | null;
}
