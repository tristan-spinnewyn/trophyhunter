// app/account/page.tsx

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition shrink-0"
            title="Retour à la bibliothèque"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-purple-400" />
              <span>Mon Profil & Gestion des Plateformes</span>
            </h1>
            <p className="text-xs text-slate-400">
              Liez vos comptes Steam, Xbox, Epic Games et GOG pour synchroniser
              vos jeux et vos succès.
            </p>
          </div>
        </div>
      </div>

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
