// app/game/[id]/hooks/useGameDetails.types.ts

import type {
  OwnedGame,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";

export interface UseGameDetailsParams {
  appId: number;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  currentUser: UserType | null;
  accountProfile: UserAccountProfile;
  steamUser: string;
  upsertOwnedGameInMemoryAndDb: (game: OwnedGame) => Promise<any>;
}
