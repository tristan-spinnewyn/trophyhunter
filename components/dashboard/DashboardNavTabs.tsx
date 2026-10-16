import {
  Layers,
  Copy,
  Heart,
  Folder,
  Database,
  ShieldCheck,
} from "lucide-react";
import type {
  UserAccountProfile,
  PlatformType,
  User as UserType,
} from "@/lib/types";
import { ALL_PLATFORMS, PLATFORM_META } from "@/lib/storage";

export type DashboardTabType =
  | PlatformType
  | "all"
  | "duplicates"
  | "wishlist"
  | "collections";

interface DashboardNavTabsProps {
  activePlatformTab: DashboardTabType;
  onSelectTab: (tab: DashboardTabType) => void;
  ownedGamesCount: number;
  platformCounts: Record<string, number>;
  accountProfile: UserAccountProfile;
  duplicateCount: number;
  wishlistCount: number;
  collectionsCount: number;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
}

export default function DashboardNavTabs({
  activePlatformTab,
  onSelectTab,
  ownedGamesCount,
  platformCounts,
  accountProfile,
  duplicateCount,
  wishlistCount,
  collectionsCount,
  currentUser,
  onOpenAuthModal,
}: DashboardNavTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
      {/* Global Overview Tab */}
      <button
        onClick={() => onSelectTab("all")}
        className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 font-bold whitespace-nowrap transition shrink-0 ${
          activePlatformTab === "all"
            ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
            : "border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Vue Globale</span>
        <span
          className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
            activePlatformTab === "all"
              ? "bg-slate-950/30 text-slate-950 font-black"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {ownedGamesCount}
        </span>
      </button>

      {/* Per-Platform Tabs */}
      {ALL_PLATFORMS.map((plat) => {
        const meta = PLATFORM_META[plat];
        const count = platformCounts[plat] || 0;
        const isConnected = !!accountProfile.accounts[plat];
        const isActive = activePlatformTab === plat;

        return (
          <button
            key={plat}
            onClick={() => onSelectTab(plat)}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
              isActive
                ? `${meta.badgeClass} ring-2 ring-current/40 shadow-lg`
                : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
            }`}
          >
            <span>{meta.shortName}</span>
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-black/30 font-black"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
            {isConnected && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
                title="Compte lié"
              />
            )}
          </button>
        );
      })}

      {/* Doublons Multiplateformes Tab */}
      <button
        onClick={() => onSelectTab("duplicates")}
        className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
          activePlatformTab === "duplicates"
            ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/40 shadow-lg"
            : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <Copy className="h-3.5 w-3.5 text-purple-400" />
        <span>Doublons</span>
        {duplicateCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "duplicates"
                ? "bg-purple-900 text-purple-200 font-black"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {duplicateCount}
          </span>
        )}
      </button>

      {/* Wishlist Tab */}
      <button
        onClick={() => onSelectTab("wishlist")}
        className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
          activePlatformTab === "wishlist"
            ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40 shadow-lg"
            : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <Heart className="h-3.5 w-3.5 text-rose-400" />
        <span>Liste d&apos;envies</span>
        {wishlistCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "wishlist"
                ? "bg-rose-900 text-rose-200 font-black"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {wishlistCount}
          </span>
        )}
      </button>

      {/* Collections Tab */}
      <button
        onClick={() => onSelectTab("collections")}
        className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-bold whitespace-nowrap transition shrink-0 ${
          activePlatformTab === "collections"
            ? "border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/40 shadow-lg"
            : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
      >
        <Folder className="h-3.5 w-3.5 text-indigo-400" />
        <span>Collections</span>
        {collectionsCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activePlatformTab === "collections"
                ? "bg-indigo-900 text-indigo-200 font-black"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {collectionsCount}
          </span>
        )}
      </button>

      {/* SQLite Auth status badge */}
      <div className="ml-auto flex items-center gap-1.5 pl-2 shrink-0">
        {currentUser ? (
          <button
            onClick={onOpenAuthModal}
            title="Session SQLite active • Clés API chiffrées AES-256-GCM"
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SQLite : @{currentUser.username}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            title="Activer la base SQLite pour sécuriser vos clés API et synchroniser vos données"
            className="flex items-center gap-1.5 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20"
          >
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span>Base SQLite (Sécurisée)</span>
          </button>
        )}
      </div>
    </div>
  );
}
