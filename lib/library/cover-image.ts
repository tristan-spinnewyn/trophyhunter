// lib/library/cover-image.ts

import type { OwnedGame } from "@/lib/types";

/** Portrait box art for face-out covers; Steam publishes it per app, other stores keep the stored image. */
export function getPortraitCoverUrl(game: Pick<OwnedGame, "appId" | "platform" | "headerImg">): string {
  if (game.platform === "steam") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`;
  }
  return game.headerImg;
}
