// lib/library/game-ref-input.ts
import type { GameRef, PlatformType } from "@/lib/types";
import { ALL_PLATFORMS } from "@/lib/platforms";

/** Reads a { platform, appId } reference from untrusted input; null when malformed. */
export function parseGameRef(value: unknown): GameRef | null {
  if (!value || typeof value !== "object") return null;
  const { platform, appId } = value as { platform?: unknown; appId?: unknown };
  if (!ALL_PLATFORMS.includes(platform as PlatformType)) return null;
  if (!Number.isSafeInteger(appId)) return null;
  return { platform: platform as PlatformType, appId: appId as number };
}
