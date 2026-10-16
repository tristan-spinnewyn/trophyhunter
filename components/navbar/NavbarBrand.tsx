// components/navbar/NavbarBrand.tsx

import Link from "next/link";
import { Trophy } from "lucide-react";

export function NavbarBrand() {
  return (
    <Link href="/" className="flex cursor-pointer items-center gap-2 select-none shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
        <Trophy className="h-5 w-5 text-slate-950 stroke-[2.5]" />
      </div>
      <div className="hidden sm:block">
        <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
          TrophyHunter
          <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
            FR
          </span>
        </h1>
        <p className="text-[11px] text-slate-400">
          Chasseur de Succès Multi-Plateforme
        </p>
      </div>
    </Link>
  );
}
