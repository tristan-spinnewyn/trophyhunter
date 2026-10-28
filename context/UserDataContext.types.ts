// context/UserDataContext.types.ts

import type { UserAccountProfile, OwnedGame, User as UserType, CollectionWithGames } from "@/lib/types";

export interface UserDataContextType {
  readonly currentUser: UserType | null;
  readonly setCurrentUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  readonly accountProfile: UserAccountProfile;
  readonly setAccountProfile: React.Dispatch<React.SetStateAction<UserAccountProfile>>;
  readonly ownedGames: OwnedGame[];
  readonly setOwnedGames: React.Dispatch<React.SetStateAction<OwnedGame[]>>;
  readonly favorites: number[];
  readonly setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
  readonly wishlistIds: number[];
  readonly setWishlistIds: React.Dispatch<React.SetStateAction<number[]>>;
  readonly collections: CollectionWithGames[];
  readonly setCollections: React.Dispatch<React.SetStateAction<CollectionWithGames[]>>;
  readonly steamUser: string;
  readonly setSteamUser: React.Dispatch<React.SetStateAction<string>>;
  readonly steamApiKey: string;
  readonly setSteamApiKey: React.Dispatch<React.SetStateAction<string>>;
  readonly isCheckingAuth: boolean;
  readonly isAuthOpen: boolean;
  readonly setIsAuthOpen: (open: boolean) => void;
  readonly isSettingsOpen: boolean;
  readonly setIsSettingsOpen: (open: boolean) => void;
  readonly refreshUserData: () => Promise<void>;
  readonly handleLogout: () => Promise<void>;
  readonly handleAuthSuccess: (u: UserType) => Promise<void>;
  readonly upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<void>;
}
