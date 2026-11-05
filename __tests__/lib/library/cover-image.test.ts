import { describe, it, expect } from "vitest";
import { getPortraitCoverUrl } from "@/lib/library/cover-image";

describe("getPortraitCoverUrl", () => {
  it("uses Steam's portrait library art for Steam games", () => {
    expect(getPortraitCoverUrl({ appId: 367520, platform: "steam", headerImg: "https://x/header.jpg" })).toBe(
      "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg"
    );
  });

  it("keeps the stored cover for other platforms", () => {
    expect(getPortraitCoverUrl({ appId: 12, platform: "gog", headerImg: "https://gog/cover.jpg" })).toBe(
      "https://gog/cover.jpg"
    );
  });
});
