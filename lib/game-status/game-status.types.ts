// lib/game-status/game-status.types.ts

export type GameStatus = "backlog" | "in-progress" | "completed";

export interface GameStatusOption {
  readonly value: GameStatus;
  readonly label: string;
  readonly shortLabel: string;
  readonly badgeClass: string;
  readonly activeButtonClass: string;
}

export class InvalidGameStatusError extends Error {
  public readonly invalidValue: unknown;

  constructor(invalidValue: unknown) {
    super(`Invalid game status: ${String(invalidValue)}`);
    this.name = "InvalidGameStatusError";
    this.invalidValue = invalidValue;
  }
}
