// components/navbar/MobileTabBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation/app-nav";
import { APP_NAV_ICONS } from "./appNavIcons";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-ink/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-3">
        {APP_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = APP_NAV_ICONS[item.id];
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-lamp-bright" : "text-faint active:text-paper-dim"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
