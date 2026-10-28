// lib/gamepass/gamepass.types.ts

import type { OwnedGame } from "@/lib/types";

export interface GamePassCatalogItem {
  readonly storeId: string;
  readonly appId: number;
  readonly name: string;
  readonly headerImg: string;
  readonly developer: string;
  readonly publisher: string;
  readonly category: string;
  readonly shortDescription: string;
  readonly hasXboxAchievements: boolean;
  readonly isPlayAnywhere: boolean;
  readonly releaseDate?: string;
}

export interface GamePassSiglEntry {
  readonly id?: string;
  readonly siglId?: string;
}

export interface MsDisplayCatalogImage {
  readonly ImagePurpose?: string;
  readonly Uri?: string;
}

export interface MsDisplayCatalogAttribute {
  readonly Name?: string;
}

export interface MsDisplayCatalogAlternateId {
  readonly IdType?: string;
  readonly Value?: string;
}

export interface MsDisplayCatalogLocalizedProperty {
  readonly ProductTitle?: string;
  readonly ShortTitle?: string;
  readonly ShortDescription?: string;
  readonly ProductDescription?: string;
  readonly DeveloperName?: string;
  readonly PublisherName?: string;
  readonly Images?: readonly MsDisplayCatalogImage[];
}

export interface MsDisplayCatalogMarketProperty {
  readonly OriginalReleaseDate?: string;
}

export interface MsDisplayCatalogProperties {
  readonly Category?: string;
  readonly Categories?: readonly string[];
  readonly Attributes?: readonly MsDisplayCatalogAttribute[];
}

export interface MsDisplayCatalogProduct {
  readonly ProductId?: string;
  readonly LocalizedProperties?: readonly MsDisplayCatalogLocalizedProperty[];
  readonly MarketProperties?: readonly MsDisplayCatalogMarketProperty[];
  readonly Properties?: MsDisplayCatalogProperties;
  readonly AlternateIds?: readonly MsDisplayCatalogAlternateId[];
}

export interface MsDisplayCatalogResponse {
  readonly Products?: readonly MsDisplayCatalogProduct[];
}

export class GamePassCatalogError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "GamePassCatalogError";
    this.statusCode = statusCode;
  }
}

export type GamePassFeatureFilter =
  | "all"
  | "achievements"
  | "play-anywhere"
  | "owned"
  | "unowned";

export interface GamePassFilterParams {
  readonly catalog: readonly GamePassCatalogItem[];
  readonly ownedGames: readonly OwnedGame[];
  readonly searchQuery: string;
  readonly categoryFilter: string;
  readonly featureFilter: GamePassFeatureFilter;
}
