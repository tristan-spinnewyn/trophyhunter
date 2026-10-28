// components/dashboard/hooks/useAccountDashboardController.types.ts

import type {
  UserAccountProfile,
  OwnedGame,
  User as UserType,
} from "@/lib/types";
import type { CollectionWithGames } from "@/lib/types";

export interface AccountDashboardControllerParams {
  accountProfile: UserAccountProfile;
  ownedGames: OwnedGame[];
  onAccountChange: (profile: UserAccountProfile) => void;
  onOwnedGamesChange: (games: OwnedGame[]) => void;
  onSelectGame: (appId: number) => void;
  onSteamUserChange: (steamUser: string) => void;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  initialSteamApiKey?: string;
  initialWishlist?: number[];
  initialCollections?: CollectionWithGames[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: CollectionWithGames[]) => void;
}
