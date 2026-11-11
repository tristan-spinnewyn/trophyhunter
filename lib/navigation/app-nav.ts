// lib/navigation/app-nav.ts

export type AppNavItemId = "library" | "review" | "accounts";

export interface AppNavItem {
  readonly id: AppNavItemId;
  readonly href: string;
  readonly label: string;
  readonly shortLabel: string;
  /** Extra path sections that belong to this item (e.g. game pages live under the library). */
  readonly sections: readonly string[];
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    id: "library",
    href: "/",
    label: "Ma collection",
    shortLabel: "Collection",
    sections: ["/game"],
  },
  {
    id: "review",
    href: "/annee",
    label: "Mon année",
    shortLabel: "Mon année",
    sections: [],
  },
  {
    id: "accounts",
    href: "/account",
    label: "Mes comptes",
    shortLabel: "Comptes",
    sections: [],
  },
];

function isWithinSection(pathname: string, section: string): boolean {
  return pathname === section || pathname.startsWith(`${section}/`);
}

export function isNavItemActive(item: AppNavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.href === "/") {
    return pathname === "/" || item.sections.some((section) => isWithinSection(pathname, section));
  }
  return [item.href, ...item.sections].some((section) => isWithinSection(pathname, section));
}
