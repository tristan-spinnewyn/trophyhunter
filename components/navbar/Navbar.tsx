// components/navbar/Navbar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useUserData } from "@/context/UserDataContext";
import { NavbarSearch } from "@/components/NavbarSearch";
import { NavbarBrand } from "./NavbarBrand";
import { NavbarNavLinks } from "./NavbarNavLinks";
import { NavbarUserActions } from "./NavbarUserActions";

interface NavbarProps {
  onSelectGame?: (appId: number) => void;
}

export default function Navbar({ onSelectGame }: NavbarProps) {
  const pathname = usePathname();
  const {
    ownedGames,
    currentUser,
    handleLogout,
    setIsAuthOpen,
    setIsSettingsOpen,
  } = useUserData();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14">
        <NavbarBrand />

        <NavbarNavLinks
          pathname={pathname}
          ownedGamesCount={ownedGames.length}
        />

        <NavbarSearch onSelectGame={onSelectGame} />

        <NavbarUserActions
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>
    </header>
  );
}
