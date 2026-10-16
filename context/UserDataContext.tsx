// context/UserDataContext.tsx
"use client";

import React, { createContext, useContext } from "react";
import type { UserDataContextType } from "./UserDataContext.types";
import { useUserDataState } from "./useUserDataState";

export * from "./UserDataContext.types";

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const value = useUserDataState();
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
