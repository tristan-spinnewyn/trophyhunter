// components/navbar/NavbarBrand.tsx

import Link from "next/link";

export function NavbarBrand() {
  return (
    <Link href="/" aria-label="TrophyHunter, accueil" className="flex cursor-pointer items-center gap-2 select-none shrink-0">
      <span className="font-wide text-lg font-extrabold tracking-[-0.01em] text-paper">
        TrophyHunter
      </span>
    </Link>
  );
}
