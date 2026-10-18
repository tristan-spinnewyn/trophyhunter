// lib/xbox/types.ts

import type { OwnedGame, PlatformAccount } from "@/lib/types";

export interface XboxProfileSyncResult {
  readonly account: PlatformAccount;
  readonly discoveredGames: OwnedGame[];
}

export interface OpenXblProfileSetting {
  readonly id: string;
  readonly value: string;
}

export interface OpenXblProfile {
  readonly id?: string;
  readonly hostId?: string;
  readonly settings?: readonly OpenXblProfileSetting[];
}

export interface OpenXblPerson {
  readonly xuid?: string;
  readonly gamertag?: string;
  readonly displayPicRaw?: string;
  readonly gamerScore?: string | number;
}

export interface OpenXblAchievementSummary {
  readonly totalAchievements?: number;
  readonly currentAchievements?: number;
  readonly currentGamerscore?: number;
  readonly totalGamerscore?: number;
  readonly progressPercentage?: number;
}

export interface OpenXblAchievementItem {
  readonly id?: string;
  readonly isUnlocked?: boolean;
  readonly progressState?: string;
  readonly gamerscore?: number;
}

export interface OpenXblTitle {
  readonly titleId: string | number;
  readonly name: string;
  readonly type?: string;
  readonly image?: string;
  readonly displayImage?: string;
  readonly currentGamerscore?: number;
  readonly maxGamerscore?: number;
  readonly achievement?: OpenXblAchievementSummary;
  readonly achievements?: readonly OpenXblAchievementItem[];
}

export interface OpenXblProfilePayload {
  readonly profileUsers?: readonly OpenXblProfile[];
  readonly people?: readonly OpenXblPerson[];
}

export interface OpenXblTitlesPayload {
  readonly xuid?: string;
  readonly titles?: readonly OpenXblTitle[];
}

export class XboxApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "XboxApiError";
    this.status = status;
  }
}
