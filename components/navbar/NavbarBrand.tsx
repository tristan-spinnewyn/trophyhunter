// components/navbar/NavbarBrand.tsx

import Link from "next/link";
import { Trophy } from "lucide-react";

export function NavbarBrand() {
  return (
    <Link href="/" aria-label="TrophyHunter, accueil" className="flex cursor-pointer items-center gap-2 select-none shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
        <Trophy className="h-4 w-4 text-slate-950 stroke-[2.5]" />
      </div>
      <span className="hidden lg:block text-base font-semibold tracking-tight text-white">
        TrophyHunter
      </span>
    </Link>
  );
}
