import { describe, it, expect } from "vitest";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation/app-nav";

const library = APP_NAV_ITEMS.find((item) => item.id === "library")!;
const accounts = APP_NAV_ITEMS.find((item) => item.id === "accounts")!;

describe("APP_NAV_ITEMS", () => {
  it("lists the library first, then the accounts page", () => {
    expect(APP_NAV_ITEMS.map((item) => item.href)).toEqual(["/", "/account"]);
  });
});

describe("isNavItemActive", () => {
  it("marks the library active on the home page", () => {
    expect(isNavItemActive(library, "/")).toBe(true);
    expect(isNavItemActive(accounts, "/")).toBe(false);
  });

  it("keeps the library active while browsing a game page", () => {
    expect(isNavItemActive(library, "/game/1245620")).toBe(true);
    expect(isNavItemActive(accounts, "/game/1245620")).toBe(false);
  });

  it("marks the accounts item active on the account page and its subpaths", () => {
    expect(isNavItemActive(accounts, "/account")).toBe(true);
    expect(isNavItemActive(accounts, "/account/steam")).toBe(true);
    expect(isNavItemActive(library, "/account")).toBe(false);
  });

  it("does not match paths that only share a prefix string", () => {
    expect(isNavItemActive(accounts, "/accounting")).toBe(false);
    expect(isNavItemActive(library, "/gamesxyz")).toBe(false);
  });

  it("treats a null pathname as inactive", () => {
    expect(isNavItemActive(library, null)).toBe(false);
  });
});
