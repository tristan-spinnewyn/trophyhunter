// lib/types/auth.ts
import type { UserAccountProfile } from "./platform";
import type { OwnedGame, UserGameProgress } from "./game";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  gameCount?: number;
  gameIds?: number[];
}

export interface DatabaseSyncPayload {
  profile?: UserAccountProfile;
  games?: OwnedGame[];
  favorites?: number[];
  wishlist?: number[];
  collections?: Array<{
    id?: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    gameIds?: number[];
  }>;
  recentAppIds?: number[];
  steamApiKey?: string;
  progress?: Record<string, UserGameProgress>;
}
