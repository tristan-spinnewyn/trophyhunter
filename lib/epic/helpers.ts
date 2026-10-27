
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

export function extractBestCover(
  rawKeyImages: any,
  customAttributes?: any
): string {
  if (typeof rawKeyImages === "string") {
    try {
      rawKeyImages = JSON.parse(rawKeyImages);
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

  if (Array.isArray(rawKeyImages)) {
    for (const pType of preferred) {
      const found = rawKeyImages.find(
        (img: any) =>
          (img.type === pType || img.imageType === pType) &&
          (img.url || img.link)
      );
      if (found) {
        return found.url || found.link;
      }
    }
    if (
      rawKeyImages.length > 0 &&
      (rawKeyImages[0].url || rawKeyImages[0].link)
    ) {
      return rawKeyImages[0].url || rawKeyImages[0].link;
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
