// context/UserDataContext.types.ts
import type { UserAccountProfile, OwnedGame, User as UserType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

export interface UserDataContextType {
  currentUser: UserType | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  accountProfile: UserAccountProfile;
  setAccountProfile: React.Dispatch<React.SetStateAction<UserAccountProfile>>;
  ownedGames: OwnedGame[];
  setOwnedGames: React.Dispatch<React.SetStateAction<OwnedGame[]>>;
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
  wishlistIds: number[];
  setWishlistIds: React.Dispatch<React.SetStateAction<number[]>>;
  collections: LocalCollection[];
  setCollections: React.Dispatch<React.SetStateAction<LocalCollection[]>>;
  steamUser: string;
  setSteamUser: React.Dispatch<React.SetStateAction<string>>;
  steamApiKey: string;
  setSteamApiKey: React.Dispatch<React.SetStateAction<string>>;
  isCheckingAuth: boolean;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  refreshUserData: () => Promise<void>;
  handleSyncLocalToSQLite: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleAuthSuccess: (u: UserType) => Promise<void>;
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<void>;
}
