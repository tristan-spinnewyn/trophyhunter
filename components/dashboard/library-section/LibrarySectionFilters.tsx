// components/dashboard/library-section/LibrarySectionFilters.tsx

import { Search } from "lucide-react";
import type { PlatformType } from "@/lib/types";
import type { LibraryTab, StatusFilterType, AchievementFilterType } from "@/lib/library/library-filters";
import { LibraryFilterDropdowns } from "./LibraryFilterDropdowns";
import type { SortOrderType } from "@/lib/library/library-sort";

interface LibrarySectionFiltersProps {
  activePlatformTab: LibraryTab;
  libSearch: string;
  setLibSearch: (val: string) => void;
  libPlatformFilter: PlatformType | "all";
  setLibPlatformFilter: (val: PlatformType | "all") => void;
  libStatusFilter: StatusFilterType;
  setLibStatusFilter: (val: StatusFilterType) => void;
  libAchievementFilter: AchievementFilterType;
  setLibAchievementFilter: (val: AchievementFilterType) => void;
  libSortOrder: SortOrderType;
  setLibSortOrder: (val: SortOrderType) => void;
}

export function LibrarySectionFilters({
  activePlatformTab,
  libSearch,
  setLibSearch,
  libPlatformFilter,
  setLibPlatformFilter,
  libStatusFilter,
  setLibStatusFilter,
  libAchievementFilter,
  setLibAchievementFilter,
  libSortOrder,
  setLibSortOrder,
}: LibrarySectionFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <div className="relative col-span-2 sm:flex-1 sm:min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={libSearch}
          onChange={(e) => setLibSearch(e.target.value)}
          placeholder="Filtrer mes jeux…"
          aria-label="Filtrer mes jeux"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
        />
      </div>

      <LibraryFilterDropdowns
        activePlatformTab={activePlatformTab}
        libPlatformFilter={libPlatformFilter}
        setLibPlatformFilter={setLibPlatformFilter}
        libStatusFilter={libStatusFilter}
        setLibStatusFilter={setLibStatusFilter}
        libAchievementFilter={libAchievementFilter}
        setLibAchievementFilter={setLibAchievementFilter}
        libSortOrder={libSortOrder}
        setLibSortOrder={setLibSortOrder}
      />
    </div>
  );
}
