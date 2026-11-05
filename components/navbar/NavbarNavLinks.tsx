// components/navbar/NavbarNavLinks.tsx

import Link from "next/link";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation/app-nav";
import { textTabClassName } from "@/components/ui/textTab";

interface NavLinksProps {
  pathname: string;
  ownedGamesCount: number;
}

export function NavbarNavLinks({ pathname, ownedGamesCount }: NavLinksProps) {
  return (
    <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-5">
      {APP_NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item, pathname);
                const count = item.id === "library" ? ownedGamesCount : 0;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={textTabClassName(isActive)}
          >
                        <span>{item.label}</span>
            {count > 0 && (
              <span className="text-[13px] tabular-nums text-dust">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
