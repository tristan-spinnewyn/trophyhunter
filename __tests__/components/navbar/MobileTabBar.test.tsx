import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { MobileTabBar } = await import("@/components/navbar/MobileTabBar");

function currentLinks(html: string): string[] {
  return [...html.matchAll(/<a [^>]*aria-current="page"[^>]*>.*?<\/svg>([^<]+)<\/a>/g)].map((m) => m[1]);
}

describe("MobileTabBar", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("renders one link per app section", () => {
    const html = renderToStaticMarkup(<MobileTabBar />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/account"');
  });

  it("highlights the library on a game page", () => {
    pathname = "/game/1245620";
    expect(currentLinks(renderToStaticMarkup(<MobileTabBar />))).toEqual(["Bibliothèque"]);
  });

  it("highlights the accounts tab on the account page", () => {
    pathname = "/account";
    expect(currentLinks(renderToStaticMarkup(<MobileTabBar />))).toEqual(["Comptes"]);
  });
});
