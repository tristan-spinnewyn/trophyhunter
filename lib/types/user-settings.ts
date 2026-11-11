// lib/types/user-settings.ts

export interface UserSettings {
  /** Hours between two automatic syncs of every connected platform, or null when off. */
  readonly autoSyncHours: number | null;
  /** Weeks without a session after which an in-progress game is offered a pause. */
  readonly staleAfterWeeks: number;
}
