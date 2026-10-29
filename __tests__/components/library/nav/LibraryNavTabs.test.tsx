// @vitest-environment jsdom
// __tests__/components/library/nav/LibraryNavTabs.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LibraryNavTabs, { type LibraryNavTabsProps } from "@/components/library/LibraryNavTabs";

function renderTabs(overrides: Partial<LibraryNavTabsProps> = {}) {
  const props: LibraryNavTabsProps = {
    activePlatformTab: "all",
    onSelectTab: vi.fn(),
    ownedGamesCount: 42,
    platformCounts: { steam: 30, xbox: 0 },
    accountProfile: {
      displayName: "Gabe",
      accounts: { steam: { platform: "steam" } },
    } as unknown as LibraryNavTabsProps["accountProfile"],
    duplicateCount: 2,
    wishlistCount: 0,
    collectionsCount: 1,
    ...overrides,
  };
  render(<LibraryNavTabs {...props} />);
  return props;
}

function tab(name: RegExp) {
  return screen.getByRole("button", { name });
}

describe("LibraryNavTabs", () => {
  afterEach(cleanup);

  it("marks the active tab as pressed", () => {
    renderTabs({ activePlatformTab: "wishlist" });

    expect(tab(/^Tous/).getAttribute("aria-pressed")).toBe("false");
    expect(tab(/Liste d'envies/).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows counts only when there is something to count", () => {
    renderTabs();

    expect(tab(/^Tous/).textContent).toBe("Tous42");
    expect(tab(/^Steam/).textContent).toBe("Steam30");
    expect(tab(/^Xbox/).textContent).toBe("Xbox");
    expect(tab(/Doublons/).textContent).toBe("Doublons2");
    expect(tab(/Liste d'envies/).textContent).toBe("Liste d'envies");
  });

  it("flags which platforms have a linked account", () => {
    renderTabs();

    expect(tab(/^Steam/).querySelector('[title="Compte lié"]')).toBeTruthy();
    expect(tab(/^Xbox/).querySelector('[title="Compte non lié"]')).toBeTruthy();
  });

  it("selects the clicked tab", () => {
    const props = renderTabs({ activePlatformTab: "steam" });

    for (const name of [/^Tous/, /^Steam/, /PC Game Pass/, /Doublons/, /Liste d'envies/, /Collections/]) {
      fireEvent.click(tab(name));
    }

    expect(vi.mocked(props.onSelectTab).mock.calls.map(([t]) => t)).toEqual([
      "all", "steam", "gamepass", "duplicates", "wishlist", "collections",
    ]);
  });
});
