// components/navbar/NavbarBrand.tsx

import Link from "next/link";
import { Trophy } from "lucide-react";

export function NavbarBrand() {
  return (
    <Link href="/" aria-label="TrophyHunter, accueil" className="flex cursor-pointer items-center gap-2 select-none shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lamp-bright to-lamp">
        <Trophy className="h-4 w-4 text-ink stroke-[2.5]" />
      </div>
      <span className="hidden lg:block text-base font-semibold tracking-tight text-paper">
        TrophyHunter
      </span>
    </Link>
  );
}
