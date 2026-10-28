// components/navbar/NavbarNavLinks.tsx

import Link from "next/link";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation/app-nav";
import { APP_NAV_ICONS } from "./appNavIcons";

interface NavLinksProps {
  pathname: string;
  ownedGamesCount: number;
}

export function NavbarNavLinks({ pathname, ownedGamesCount }: NavLinksProps) {
  return (
    <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
      {APP_NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = APP_NAV_ICONS[item.id];
        const count = item.id === "library" ? ownedGamesCount : 0;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {count > 0 && (
              <span className="rounded-md bg-slate-700/70 px-1.5 text-[11px] tabular-nums text-slate-300">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
