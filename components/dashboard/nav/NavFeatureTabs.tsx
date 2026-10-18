// components/dashboard/nav/NavFeatureTabs.tsx

import { Copy, Heart, Folder, MonitorPlay } from "lucide-react";
import type { DashboardTabType } from "./DashboardNavTabs.types";

interface NavFeatureTabsProps {
  readonly activePlatformTab: DashboardTabType;
  readonly onSelectTab: (tab: DashboardTabType) => void;
  readonly duplicateCount: number;
  readonly wishlistCount: number;
  readonly collectionsCount: number;
}

export function NavFeatureTabs({
  activePlatformTab,
  onSelectTab,
  duplicateCount,
  wishlistCount,
  collectionsCount,
}: NavFeatureTabsProps) {
  const baseClass =
    "flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0";
  const inactiveClass =
    "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white";

  return (
    <>
      <button
        onClick={() => onSelectTab("gamepass")}
        className={`${baseClass} ${
          activePlatformTab === "gamepass"
            ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg"
            : inactiveClass
        }`}
      >
        <MonitorPlay className="h-3.5 w-3.5 text-emerald-400" />
        <span>PC Game Pass</span>
      </button>

      <button
        onClick={() => onSelectTab("duplicates")}
        className={`${baseClass} ${
          activePlatformTab === "duplicates"
            ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/40 shadow-lg"
            : inactiveClass
        }`}
      >
        <Copy className="h-3.5 w-3.5 text-purple-400" />
        <span>Doublons</span>
        {duplicateCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "duplicates" ? "bg-purple-900 text-purple-200 font-black" : "bg-slate-800 text-slate-400"
            }`}
          >
            {duplicateCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab("wishlist")}
        className={`${baseClass} ${
          activePlatformTab === "wishlist"
            ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40 shadow-lg"
            : inactiveClass
        }`}
      >
        <Heart className="h-3.5 w-3.5 text-rose-400" />
        <span>Liste d&apos;envies</span>
        {wishlistCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "wishlist" ? "bg-rose-900 text-rose-200 font-black" : "bg-slate-800 text-slate-400"
            }`}
          >
            {wishlistCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onSelectTab("collections")}
        className={`${baseClass} ${
          activePlatformTab === "collections"
            ? "border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/40 shadow-lg"
            : inactiveClass
        }`}
      >
        <Folder className="h-3.5 w-3.5 text-indigo-400" />
        <span>Collections</span>
        {collectionsCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "collections" ? "bg-indigo-900 text-indigo-200 font-black" : "bg-slate-800 text-slate-400"
            }`}
          >
            {collectionsCount}
          </span>
        )}
      </button>
    </>
  );
}
