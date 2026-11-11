// lib/types/play-session.ts
import type { PlatformType } from "./platform";

/** Time played on a game between two syncs, as the platform's playtime counter grew. */
export interface PlaySession {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly headerImg?: string;
  readonly minutes: number;
  /** When the sync noticed the extra playtime. */
  readonly detectedAt: string;
  /** The platform's own last-session date, when it reports one. */
  readonly lastPlayed?: string;
}
