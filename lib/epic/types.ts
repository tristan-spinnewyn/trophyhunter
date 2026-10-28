// lib/epic/types.ts
// Shapes of the Epic payloads this app reads. Fields are optional because the
// library service, launcher assets, entitlements and catalog each fill a
// different subset.

/** A player achievement as returned by unwrapPlayerAchievement. */
export interface EpicPlayerAchievement {
  achievementName: string;
  unlocked: boolean;
}

export interface AchSummary {
  sandboxId: string;
  totalUnlocked: number;
  totalAchievements: number;
  totalXP: number;
  gameTitle?: string;
  coverUrl?: string;
  playerAchievements?: EpicPlayerAchievement[];
}

export interface EpicTokenResponse {
  access_token: string;
  refresh_token?: string;
  account_id: string;
  displayName?: string;
}

/** Image entry in Epic catalog and library payloads; services use different field names. */
export interface EpicKeyImage {
  type?: string;
  imageType?: string;
  url?: string;
  link?: string;
}

/** Catalog custom attributes, e.g. { SandboxId: { value: "..." } }. */
export type EpicCustomAttributes = Record<string, { value?: string } | undefined>;

interface EpicItemFields {
  catalogItemId?: string;
  namespace?: string;
  catalogNamespace?: string;
  sandboxId?: string;
  title?: string;
  displayName?: string;
  /** Usually EpicKeyImage[], sometimes a JSON string of it. */
  keyImages?: unknown;
  images?: unknown;
}

export interface EpicItemMetadata extends EpicItemFields {
  itemName?: string;
  mainGameItem?: boolean;
  customAttributes?: EpicCustomAttributes;
}

/** One owned item from the library service, the launcher assets or the entitlements API. */
export interface EpicLibraryItem extends EpicItemFields {
  appName?: string;
  name?: string;
  headerImg?: string;
  metadata?: EpicItemMetadata;
}

/** An item of the catalog bulk endpoint. */
export interface EpicCatalogItem {
  id?: string;
  title?: string;
  name?: string;
  keyImages?: unknown;
  customAttributes?: EpicCustomAttributes;
}

export interface EpicEntitlement {
  entitlementName?: string;
  catalogItemId?: string;
  namespace?: string;
}
