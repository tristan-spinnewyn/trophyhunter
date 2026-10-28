// @vitest-environment jsdom
// __tests__/components/filter-toolbar/FilterToolbar.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import FilterToolbar from "@/components/filter-toolbar/FilterToolbar";

function renderToolbar(overrides: Partial<ComponentProps<typeof FilterToolbar>> = {}) {
  const props: ComponentProps<typeof FilterToolbar> = {
    filter: "all",
    onFilterChange: vi.fn(),
    search: "",
    onSearchChange: vi.fn(),
    sort: "default",
    onSortChange: vi.fn(),
    revealSecrets: false,
    onToggleRevealSecrets: vi.fn(),
    counts: { all: 50, locked: 30, unlocked: 20, missable: 4, hidden: 6 },
    ...overrides,
  };
  render(<FilterToolbar {...props} />);
  return props;
}

describe("FilterToolbar", () => {
  afterEach(cleanup);

  it("counts each filter tab and marks the active one", () => {
    renderToolbar({ filter: "locked" });

    expect(screen.getByRole("button", { name: "À faire30" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Chasse active0" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Secrets6" })).toBeTruthy();
  });

  it("changes the filter, search and sort order", () => {
    const props = renderToolbar({ counts: { all: 1, locked: 1, unlocked: 0, missable: 0, hidden: 0, pinned: 1 } });

    fireEvent.click(screen.getByRole("button", { name: "Chasse active1" }));
    fireEvent.change(screen.getByPlaceholderText(/Filtrer les succès/), { target: { value: "wake" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "rarity-asc" } });

    expect(props.onFilterChange).toHaveBeenCalledWith("pinned");
    expect(props.onSearchChange).toHaveBeenCalledWith("wake");
    expect(props.onSortChange).toHaveBeenCalledWith("rarity-asc");
  });

  it("toggles the secret descriptions", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByTitle("Révéler les secrets"));
    expect(props.onToggleRevealSecrets).toHaveBeenCalled();
    cleanup();

    renderToolbar({ revealSecrets: true });
    expect(screen.getByTitle("Masquer les secrets").textContent).toBe("Secrets révélés");
  });
});
