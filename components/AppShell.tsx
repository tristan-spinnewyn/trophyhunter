"use client";

import React, { Suspense } from "react";
import { UserDataProvider, useUserData } from "@/context/UserDataContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import SettingsModal from "@/components/SettingsModal";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    isAuthOpen,
    setIsAuthOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    handleAuthSuccess,
    handleLogout,
    handleSyncLocalToSQLite,
    steamUser,
    setSteamUser,
    steamApiKey,
    setSteamApiKey,
    refreshUserData,
    setOwnedGames,
    setAccountProfile,
    setFavorites,
    setWishlistIds,
    setCollections,
  } = useUserData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Suspense fallback={<div className="h-14 bg-slate-950 border-b border-slate-800" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <Suspense fallback={null}>{children}</Suspense>
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSyncLocalData={handleSyncLocalToSQLite}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={() => {
          setFavorites([]);
          setWishlistIds([]);
          setCollections([]);
          setOwnedGames([]);
          setAccountProfile({
            displayName: "Chasseur de Trophées",
            accounts: {},
          });
        }}
        initialSteamUser={steamUser}
        initialSteamApiKey={steamApiKey}
        onSteamUserSaved={(u, key) => {
          setSteamUser(u);
          if (key !== undefined) setSteamApiKey(key);
        }}
        onRefreshData={refreshUserData}
      />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
      <AppShellContent>{children}</AppShellContent>
    </UserDataProvider>
  );
}
