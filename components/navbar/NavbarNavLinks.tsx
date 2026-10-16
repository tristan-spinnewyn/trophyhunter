// components/navbar/NavbarNavLinks.tsx

import Link from "next/link";
import { Gamepad2, User } from "lucide-react";

interface NavLinksProps {
  pathname: string;
  ownedGamesCount: number;
}

export function NavbarNavLinks({ pathname, ownedGamesCount }: NavLinksProps) {
  const isLibraryActive = pathname === "/";
  const isAccountActive = pathname === "/account";

  return (
    <div className="hidden md:flex items-center gap-1">
      <Link
        href="/"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          isLibraryActive
            ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
            : "text-slate-400 hover:text-white hover:bg-slate-900"
        }`}
      >
        <Gamepad2 className="h-4 w-4" />
        <span>Bibliothèque</span>
        {ownedGamesCount > 0 && (
          <span
            className={`rounded-md px-1.5 py-0.2 text-[10px] ${
              isLibraryActive
                ? "bg-slate-950/20 text-slate-950 font-black"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {ownedGamesCount}
          </span>
        )}
      </Link>

      <Link
        href="/account"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          isAccountActive
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "text-slate-400 hover:text-white hover:bg-slate-900"
        }`}
      >
        <User className="h-4 w-4" />
        <span>Comptes & Plateformes</span>
      </Link>
    </div>
  );
}
