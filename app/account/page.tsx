// app/account/page.tsx

"use client";

import { useRouter } from "next/navigation";
import AccountDashboard from "@/components/AccountDashboard";
import { useUserData } from "@/context/UserDataContext";

export default function AccountPage() {
  const router = useRouter();
  const {
    accountProfile,
    setAccountProfile,
    ownedGames,
    setOwnedGames,
    setSteamUser,
    currentUser,
    setIsAuthOpen,
    steamApiKey,
    wishlistIds,
    setWishlistIds,
    collections,
    setCollections,
  } = useUserData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Comptes & plateformes
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Lie tes comptes Steam, Xbox, Epic Games et GOG pour importer tes jeux et tes succès.
        </p>
      </header>

      <AccountDashboard
        accountProfile={accountProfile}
        ownedGames={ownedGames}
        onAccountChange={setAccountProfile}
        onOwnedGamesChange={setOwnedGames}
        onSelectGame={(appId) => router.push(`/game/${appId}`)}
        onSteamUserChange={setSteamUser}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        initialSteamApiKey={steamApiKey}
        initialWishlist={wishlistIds}
        initialCollections={collections}
        onWishlistChange={setWishlistIds}
        onCollectionsChange={setCollections}
      />
    </div>
  );
}
