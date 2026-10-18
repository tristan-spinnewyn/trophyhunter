// components/FilterToolbar.tsx

"use client";

import type { FilterStatus, SortOrder } from "@/lib/types";
import { FilterToolbarControls } from "./filter-toolbar/FilterToolbarControls";
import { FilterToolbarTabs } from "./filter-toolbar/FilterToolbarTabs";

interface FilterToolbarProps {
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  revealSecrets: boolean;
  onToggleRevealSecrets: () => void;
  counts: {
    all: number;
    locked: number;
    unlocked: number;
    missable: number;
    hidden: number;
    pinned?: number;
  };
}

export default function FilterToolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
  revealSecrets,
  onToggleRevealSecrets,
  counts,
}: FilterToolbarProps) {
  return (
    <div className="space-y-3">
      <FilterToolbarControls
        search={search}
        onSearchChange={onSearchChange}
        sort={sort}
        onSortChange={onSortChange}
        revealSecrets={revealSecrets}
        onToggleRevealSecrets={onToggleRevealSecrets}
      />

      <FilterToolbarTabs
        filter={filter}
        onFilterChange={onFilterChange}
        counts={counts}
      />
    </div>
  );
}
