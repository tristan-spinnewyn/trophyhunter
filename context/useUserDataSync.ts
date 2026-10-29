// context/useUserDataSync.ts

import type { OwnedGame, User as UserType, UserAccountProfile } from "@/lib/types";

export interface SyncCollectionItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly gameIds?: number[];
}

export interface SyncResponsePayload {
  readonly games?: OwnedGame[];
  readonly profile?: UserAccountProfile;
  readonly favorites?: number[];
  readonly wishlist?: number[];
  readonly collections?: SyncCollectionItem[];
}

export async function fetchRemoteUserData(
  applySyncData: (data: SyncResponsePayload) => void
): Promise<void> {
  try {
    const res = await fetch("/api/user/sync");
    if (!res.ok) return;
    const syncData: SyncResponsePayload = await res.json();
    applySyncData(syncData);
  } catch (e) {
    console.error("Failed to refresh user data:", e);
  }
}

export async function persistGameToServer(
  currentUser: UserType | null,
  updatedGame: OwnedGame
): Promise<void> {
  if (!currentUser) return;
  try {
    await fetch("/api/user/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: updatedGame }),
    });
  } catch (e) {
    console.error("Failed to save game:", e);
  }
}
