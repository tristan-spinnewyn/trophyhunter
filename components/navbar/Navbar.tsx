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
    accountProfile,
    ownedGames,
    currentUser,
    handleLogout,
    setIsAuthOpen,
    setIsSettingsOpen,
  } = useUserData();

  const steamAcc = accountProfile?.accounts?.steam;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3">
        <NavbarBrand />

        <NavbarNavLinks
          pathname={pathname}
          ownedGamesCount={ownedGames.length}
        />

        <NavbarSearch onSelectGame={onSelectGame} />

        <NavbarUserActions
          pathname={pathname}
          steamAcc={steamAcc}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>
    </header>
  );
}
