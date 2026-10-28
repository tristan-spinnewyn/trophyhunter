// @vitest-environment jsdom
// __tests__/components/accounts/EpicLibraryTools.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EpicLibraryTools } from "@/components/accounts/EpicLibraryTools";

describe("EpicLibraryTools", () => {
  afterEach(cleanup);

  it("renders nothing without imported Epic games", () => {
    const { container } = render(
      <EpicLibraryTools
        epicCounts={{ total: 0, withAch: 0, noAch: 0 }}
        isSyncingEpic={false}
        onScanEpicAchievements={vi.fn()}
        onCleanEpicGames={vi.fn()}
      />
    );

    expect(container.innerHTML).toBe("");
  });

  it("scans the games without achievements and cleans the imports", () => {
    const onScan = vi.fn();
    const onClean = vi.fn();
    render(
      <EpicLibraryTools
        epicCounts={{ total: 5, withAch: 2, noAch: 3 }}
        isSyncingEpic={false}
        onScanEpicAchievements={onScan}
        onCleanEpicGames={onClean}
      />
    );

    expect(screen.getByText(/5 jeux Epic importés, dont 2 avec succès/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Chercher les succès (3)" }));
    fireEvent.click(screen.getByRole("button", { name: "Nettoyer les jeux Epic" }));

    expect(onScan).toHaveBeenCalled();
    expect(onClean).toHaveBeenCalled();
  });

  it("uses the singular and hides the scan when every game has achievements", () => {
    render(
      <EpicLibraryTools
        epicCounts={{ total: 1, withAch: 1, noAch: 0 }}
        isSyncingEpic
        onScanEpicAchievements={vi.fn()}
        onCleanEpicGames={vi.fn()}
      />
    );

    expect(screen.getByText(/1 jeu Epic importé/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Chercher les succès/ })).toBeNull();
  });
});
