// components/dashboard/library-section/LibrarySectionFilters.tsx

import { Search } from "lucide-react";
import type { PlatformType } from "@/lib/types";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type {
  StatusFilterType,
  AchievementFilterType,
  SortOrderType,
} from "@/components/dashboard/hooks/useLibraryFilters";
import { LibraryFilterDropdowns } from "./LibraryFilterDropdowns";

interface LibrarySectionFiltersProps {
  activePlatformTab: DashboardTabType;
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
    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={libSearch}
          onChange={(e) => setLibSearch(e.target.value)}
          placeholder="Rechercher dans mes jeux possédés..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
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
