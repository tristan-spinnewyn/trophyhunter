// app/account/page.tsx

"use client";

import { useRouter } from "next/navigation";
import AccountDashboard from "@/components/accounts/AccountDashboard";
import { useUserData } from "@/context/UserDataContext";
import { ALL_PLATFORMS, countConnectedPlatforms } from "@/lib/platforms";

export default function AccountPage() {
  const router = useRouter();
  const {
    accountProfile,
    setAccountProfile,
    ownedGames,
    setOwnedGames,
    setSteamUser,
    currentUser,
    steamApiKey,
  } = useUserData();
  const connectedCount = countConnectedPlatforms(accountProfile);

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="font-wide text-[44px] font-extrabold leading-[0.92] tracking-[-0.035em] text-paper sm:text-7xl lg:text-8xl">
          Mes comptes
        </h1>
        <p className="max-w-[52ch] text-[17px] text-dust">
          {connectedCount} {connectedCount > 1 ? "comptes liés" : "compte lié"} sur {ALL_PLATFORMS.length}. Ils remplissent ta
          collection de {ownedGames.length} {ownedGames.length > 1 ? "jeux" : "jeu"} et tiennent tes heures de jeu et tes
          succès à jour.
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
        initialSteamApiKey={steamApiKey}
      />
    </div>
  );
}
