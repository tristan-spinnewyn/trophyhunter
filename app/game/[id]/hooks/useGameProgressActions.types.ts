// app/game/[id]/hooks/useGameProgressActions.types.ts

import type {
  GameDetails,
  OwnedGame,
  UserGameProgress,
  UserAccountProfile,
  User as UserType,
  PlatformType,
} from "@/lib/types";

export interface UseGameProgressActionsParams {
  game: GameDetails | null;
  setGame?: (g: GameDetails) => void;
  owned?: OwnedGame;
  activePlatform: PlatformType;
  progress: UserGameProgress;
  setProgress: (p: UserGameProgress) => void;
  accountProfile: UserAccountProfile;
  steamUser: string;
  currentUser: UserType | null;
  favorites: number[];
  setFavorites: (favs: number[]) => void;
  ownedGames: OwnedGame[];
  upsertOwnedGameInMemoryAndDb: (g: OwnedGame) => Promise<any>;
  setIsSyncing: (s: boolean) => void;
  setSyncNotice: (n: { type: "success" | "error"; msg: string } | null) => void;
}
