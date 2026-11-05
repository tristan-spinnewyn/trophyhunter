// components/ui/coverFallback.ts

import type { SyntheticEvent } from "react";

/** onError for box art: retry once with the stored image, then hide the broken picture. */
export function fallBackThenHide(storedImage: string) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback !== "used" && img.getAttribute("src") !== storedImage) {
      img.dataset.fallback = "used";
      img.src = storedImage;
      return;
    }
    img.style.display = "none";
  };
}
