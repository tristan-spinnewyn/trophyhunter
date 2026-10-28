// lib/epic/game-metadata.ts
import type { EpicCustomAttributes, EpicKeyImage } from "./types";

export const KNOWN_EPIC_CODENAMES: Record<string, string> = {
  "aa": "Aven Colony", "angelonia": "Watch Dogs 2", "barbet": "Dishonored: Death of the Outsider",
  "cacao": "Castlevania Anniversary Collection", "camellia": "Cities: Skylines", "catnip": "Control",
  "clary": "Celeste", "condor": "Conan Exiles", "cowbird": "Overcooked! 2", "cardea": "Remnant: From the Ashes",
  "calluna": "Cave Story+", "centaurea": "Sid Meier's Civilization VI", "carrot": "Costume Quest 2",
  "bacon": "Batman: Arkham Knight", "bramble": "Borderlands 3", "aster": "Alien: Isolation",
  "azalea": "A Plague Tale: Innocence", "begonia": "BioShock Remastered", "carnation": "Control",
  "crocus": "Creature in the Well", "dahlia": "Darksiders Warmastered Edition", "delphinium": "Dead by Daylight",
  "freesia": "Fallout 3", "gardenia": "Ghostrunner", "geranium": "Grand Theft Auto V",
  "gladiolus": "Guacamelee! 2", "hyacinth": "Hell is Other Demons", "iris": "Inscryption",
  "jasmine": "Jurassic World Evolution", "lavender": "LEGO Star Wars: The Skywalker Saga", "lilac": "Limbo",
  "lotus": "Loop Hero", "magnolia": "Metro 2033 Redux", "marigold": "Mutant Year Zero: Road to Eden",
  "mimosa": "Moonlighter", "narcissus": "Night in the Woods", "orchid": "Oxenfree", "peony": "Prey",
  "petunia": "Pikuniku", "poppy": "Prison Architect", "rose": "Red Dead Redemption 2", "sage": "Subnautica",
  "sunflower": "Shadow of the Tomb Raider", "tulip": "The Escapists 2", "verbena": "Vampyr",
  "violet": "Void Bastards", "zinnia": "Zombie Army 4: Dead War", "cider": "Death Stranding",
  "birch": "The Vanishing of Ethan Carter", "chrysanthemum": "Kingdom: New Lands", "daffodil": "Enter the Gungeon",
  "elderberry": "Total War: WARHAMMER", "foxglove": "The Wolf Among Us", "gingko": "GRIME",
  "heather": "Horace", "ivy": "Inside", "juniper": "Just Cause 4", "kale": "Kingdom Come: Deliverance",
  "larkspur": "Lifeless Planet", "mint": "Minit", "nutmeg": "Nuclear Throne", "oregano": "Oddworld: New 'n' Tasty",
  "pansy": "Pillars of Eternity", "quince": "Q.U.B.E. 2", "radish": "Rayman Legends", "sorrel": "Saints Row: The Third",
  "thyme": "The Stanley Parable", "valerian": "Vampyr", "willow": "What Remains of Edith Finch",
  "yarrow": "Yooka-Laylee", "aloe": "Ape Out", "basil": "Bad North", "clover": "Cris Tales",
  "fennel": "For The King", "ginger": "Enter the Gungeon", "nut": "Nioh: The Complete Edition",
  "paprika": "Pathway", "tarragon": "The Talos Principle", "wasabi": "World War Z",
};

export const DEFAULT_EPIC_COVER =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80";

export function isUnsplashPlaceholder(url?: string | null): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function resolveEpicCodename(codename: string): string | null {
  if (!codename) return null;
  const key = codename.trim().toLowerCase();
  return KNOWN_EPIC_CODENAMES[key] || null;
}

export function isJunkHex(str: string): boolean {
  return /^[0-9a-f]{20,}$/i.test(str.trim());
}

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Picks the best cover URL from Epic key images (an array, or a JSON string of one). */
export function extractBestCover(
  rawKeyImages: unknown,
  customAttributes?: EpicCustomAttributes
): string {
  let keyImages: unknown = rawKeyImages;
  if (typeof keyImages === "string") {
    try {
      keyImages = JSON.parse(keyImages);
    } catch {}
  }

  const preferred = [
    "DieselStoreFrontWide",
    "OfferImageWide",
    "Thumbnail",
    "DieselStoreFrontTall",
    "DieselGameBox",
    "DieselGameBoxTall",
    "VaultClosed",
  ];

  if (Array.isArray(keyImages)) {
    const images = keyImages as EpicKeyImage[];
    for (const pType of preferred) {
      const found = images.find(
        (img) =>
          (img.type === pType || img.imageType === pType) &&
          (img.url || img.link)
      );
      if (found) {
        return found.url || found.link || "";
      }
    }
    if (
      images.length > 0 &&
      (images[0].url || images[0].link)
    ) {
      return images[0].url || images[0].link || "";
    }
  }

  if (customAttributes && typeof customAttributes === "object") {
    for (const key of preferred) {
      const val = customAttributes[key]?.value;
      if (val && typeof val === "string" && val.startsWith("http")) {
        return val;
      }
    }
  }

  return "";
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
