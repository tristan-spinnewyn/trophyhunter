// lib/accounts/platform-connection.ts
// Client-safe description of how each platform is connected, shared by the accounts page.

import type { PlatformAccount, PlatformType } from "@/lib/types";
import { EPIC_AUTH_CODE_URL, parseEpicAuthInput } from "@/lib/epic/auth-input";

export interface PlatformConnectionConfig {
  readonly identifierLabel: string;
  readonly identifierPlaceholder: string;
  /** Whether a sync can start without an identifier (Epic can authenticate with a code alone). */
  readonly identifierRequired: boolean;
  readonly description: string;
  readonly secret: {
    readonly label: string;
    readonly placeholder: string;
    readonly helpUrl: string;
    readonly helpLabel: string;
    readonly hint: string;
    /** Normalises what the user pastes (e.g. a whole Epic JSON response). */
    readonly parse?: (raw: string) => string;
  };
}

export const PLATFORM_CONNECTIONS: Readonly<Record<PlatformType, PlatformConnectionConfig>> = {
  steam: {
    identifierLabel: "SteamID, pseudo ou URL de profil",
    identifierPlaceholder: "76561198… ou steamcommunity.com/id/…",
    identifierRequired: true,
    description: "Importe tes jeux, ton temps de jeu et tes succès depuis ton profil Steam public.",
    secret: {
      label: "Clé API Steam",
      placeholder: "Clé API Steam",
      helpUrl: "https://steamcommunity.com/dev/apikey",
      helpLabel: "Obtenir une clé",
      hint: "Facultative : elle permet d'importer les jeux d'un profil dont la liste n'est pas publique.",
    },
  },
  xbox: {
    identifierLabel: "Gamertag",
    identifierPlaceholder: "Major Nelson",
    identifierRequired: true,
    description: "Importe tes jeux Xbox et PC Game Pass, tes succès et ton Gamerscore.",
    secret: {
      label: "Clé OpenXBL",
      placeholder: "Clé API xbl.io",
      helpUrl: "https://xbl.io",
      helpLabel: "Obtenir une clé sur xbl.io",
      hint: "Facultative : elle donne accès au détail des succès via l'API OpenXBL.",
    },
  },
  epic: {
    identifierLabel: "Pseudo Epic Games",
    identifierPlaceholder: "Ton pseudo Epic",
    identifierRequired: false,
    description: "Importe tes jeux Epic Games et leurs succès, sans partager ton mot de passe.",
    secret: {
      label: "Code d'autorisation Epic",
      placeholder: "authorizationCode ou réponse JSON complète",
      helpUrl: EPIC_AUTH_CODE_URL,
      helpLabel: "Obtenir un code sur epicgames.com",
      hint: "Connecte-toi sur epicgames.com via le lien, puis colle le code obtenu (ou toute la réponse JSON).",
      parse: parseEpicAuthInput,
    },
  },
  gog: {
    identifierLabel: "Pseudo ou URL de profil GOG",
    identifierPlaceholder: "Ton pseudo GOG",
    identifierRequired: true,
    description: "Importe les jeux de ton profil GOG public, sans GOG Galaxy.",
    secret: {
      label: "Jeton de session GOG",
      placeholder: "Jeton embed.gog.com",
      helpUrl: "https://embed.gog.com/userData.json",
      helpLabel: "Voir mes données GOG",
      hint: "Facultatif : il permet d'importer les jeux d'un profil privé.",
    },
  },
};

export interface ConnectionDescription {
  readonly isLinked: boolean;
  readonly name: string | null;
  readonly lastSyncLabel: string | null;
}

export function describeConnection(account: PlatformAccount | undefined): ConnectionDescription {
  if (!account) return { isLinked: false, name: null, lastSyncLabel: null };
  const lastSyncLabel = account.lastSyncedAt
    ? `Dernière synchro le ${new Date(account.lastSyncedAt).toLocaleDateString("fr-FR")}`
    : null;
  return { isLinked: true, name: account.displayName || account.username, lastSyncLabel };
}

export function canStartSync(platform: PlatformType, identifier: string, isSyncing: boolean): boolean {
  if (isSyncing) return false;
  return !PLATFORM_CONNECTIONS[platform].identifierRequired || identifier.trim().length > 0;
}

export interface PlatformSpecificStat {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}

/** The one figure each platform has that the others don't. */
export function getPlatformSpecificStat(
  platform: PlatformType,
  account: PlatformAccount | undefined
): PlatformSpecificStat | null {
  if (!account) return null;
  if (platform === "xbox") {
    return { label: "Gamerscore", value: `${(account.stats.gamerScore || 0).toLocaleString("fr-FR")} G` };
  }
  if (platform === "steam") {
    return {
      label: "Badges Steam",
      value: String(account.stats.badges || 0),
      hint: `${account.stats.dlcCount || 0} DLC`,
    };
  }
  return null;
}
