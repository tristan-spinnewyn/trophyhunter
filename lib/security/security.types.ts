// lib/security/security.types.ts
import type { PlatformType, OwnedGame, UserGameProgress, UserAccountProfile } from "../types";

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly maxRequests: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export interface ValidatedSyncCollection {
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly gameIds?: readonly number[];
}

export interface ValidatedSyncPayload {
  readonly profile?: UserAccountProfile;
  readonly games: readonly OwnedGame[];
  readonly favorites: readonly number[];
  readonly wishlist: readonly number[];
  readonly collections: readonly ValidatedSyncCollection[];
  readonly progress: Readonly<Record<string, UserGameProgress>>;
  readonly steamApiKey?: string;
}

export interface SafePlatformUrlResult {
  readonly valid: boolean;
  readonly normalizedUrl: string | undefined;
}

export const ALLOWED_PLATFORMS: readonly PlatformType[] = [
  "steam",
  "epic",
  "gog",
  "xbox",
] as const;
