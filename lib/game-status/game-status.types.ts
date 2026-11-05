// lib/game-status/game-status.types.ts

export type GameStatus = "backlog" | "in-progress" | "paused" | "completed" | "abandoned";

export interface GameStatusOption {
  readonly value: GameStatus;
  readonly label: string;
  /** Plural heading used for the library section of this status. */
  readonly sectionTitle: string;
  readonly badgeClass: string;
  /** Status colour as a solid fill, for dots and shelf markers. */
  readonly dotClass: string;
}

export class InvalidGameStatusError extends Error {
  public readonly invalidValue: unknown;

  constructor(invalidValue: unknown) {
    super(`Invalid game status: ${String(invalidValue)}`);
    this.name = "InvalidGameStatusError";
    this.invalidValue = invalidValue;
  }
}
