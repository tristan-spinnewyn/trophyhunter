// lib/hunting/hunting.types.ts

export type HuntingWarningType =
  | "none"
  | "online-required"
  | "unobtainable"
  | "bugged";

export interface GameHuntingOverride {
  readonly difficultyRating?: number;
  readonly estimatedHours?: number;
  readonly minPlaythroughs?: number;
  readonly warningType?: HuntingWarningType;
  readonly warningMessage?: string;
}

export interface GameHuntingMeta {
  readonly difficultyRating: number;
  readonly difficultyLabel: string;
  readonly difficultyBadgeClass: string;
  readonly estimatedHours: number;
  readonly minPlaythroughs: number;
  readonly missableCount: number;
  readonly onlineCount: number;
  readonly warningType: HuntingWarningType;
  readonly warningMessage: string | null;
  readonly isCustomOverride: boolean;
}

export class MaxPinnedTargetsExceededError extends Error {
  public readonly maxAllowed: number;

  constructor(maxAllowed: number) {
    super(`Cannot pin more than ${maxAllowed} target achievements.`);
    this.name = "MaxPinnedTargetsExceededError";
    this.maxAllowed = maxAllowed;
  }
}

export class InvalidHuntingMetaError extends Error {
  public readonly field: string;

  constructor(field: string, reason: string) {
    super(`Invalid hunting metadata for "${field}": ${reason}`);
    this.name = "InvalidHuntingMetaError";
    this.field = field;
  }
}
