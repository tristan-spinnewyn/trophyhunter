// __tests__/epic/codenames.test.ts
import { describe, it, expect } from "vitest";
import {
  isUnsplashPlaceholder,
  resolveEpicCodename,
  DEFAULT_EPIC_COVER,
  KNOWN_EPIC_CODENAMES,
} from "@/lib/epic/game-metadata";

describe("Epic Codenames Utilities", () => {
  it("detects placeholder urls correctly", () => {
    expect(isUnsplashPlaceholder(null)).toBe(true);
    expect(isUnsplashPlaceholder(undefined)).toBe(true);
    expect(isUnsplashPlaceholder("")).toBe(true);
    expect(isUnsplashPlaceholder(DEFAULT_EPIC_COVER)).toBe(true);
    expect(isUnsplashPlaceholder("https://images.unsplash.com/photo-123456?w=600")).toBe(true);
    expect(isUnsplashPlaceholder("https://cdn.akamai.steamstatic.com/steam/apps/480/header.jpg")).toBe(false);
    expect(isUnsplashPlaceholder("not-a-valid-url")).toBe(false);
  });

  it("resolves known codenames regardless of casing and whitespace", () => {
    expect(resolveEpicCodename("clary")).toBe("Celeste");
    expect(resolveEpicCodename("  CLARY  ")).toBe("Celeste");
    expect(resolveEpicCodename("wasabi")).toBe("World War Z");
    expect(resolveEpicCodename("rose")).toBe("Red Dead Redemption 2");
  });

  it("returns null for unknown codenames or falsy values", () => {
    expect(resolveEpicCodename("")).toBeNull();
    expect(resolveEpicCodename("unknown_game_xyz")).toBeNull();
    expect(resolveEpicCodename(null as unknown as string)).toBeNull();
  });

  it("exposes KNOWN_EPIC_CODENAMES map", () => {
    expect(KNOWN_EPIC_CODENAMES["clary"]).toBe("Celeste");
  });
});
