// app/account/page.tsx

"use client";

import { useRouter } from "next/navigation";
import AccountDashboard from "@/components/AccountDashboard";
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Comptes & plateformes
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {connectedCount} {connectedCount > 1 ? "comptes liés" : "compte lié"} sur {ALL_PLATFORMS.length} ·{" "}
          {ownedGames.length} {ownedGames.length > 1 ? "jeux" : "jeu"} dans ta collection
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
