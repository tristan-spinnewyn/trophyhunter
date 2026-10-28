// @vitest-environment jsdom
// __tests__/components/hunting/GameHuntingMetaBar.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GameHuntingMetaBar } from "@/components/hunting/GameHuntingMetaBar";
import type { GameHuntingMeta } from "@/lib/hunting/hunting.types";

function makeMeta(overrides: Partial<GameHuntingMeta> = {}): GameHuntingMeta {
  return {
    difficultyRating: 7,
    difficultyLabel: "Difficile",
    difficultyBadgeClass: "border-rose-500",
    estimatedHours: 80,
    minPlaythroughs: 2,
    missableCount: 3,
    onlineCount: 4,
    warningType: "none",
    warningMessage: null,
    isCustomOverride: false,
    ...overrides,
  };
}

function numberInput(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

describe("GameHuntingMetaBar", () => {
  afterEach(cleanup);

  it("summarises difficulty, duration, runs, missables and online achievements", () => {
    render(<GameHuntingMetaBar meta={makeMeta()} />);

    expect(screen.getByText("Difficulté : 7/10 • Difficile")).toBeTruthy();
    expect(screen.getByText("~80h")).toBeTruthy();
    expect(screen.getByText("2 runs min.")).toBeTruthy();
    expect(screen.getByText("3 manquables")).toBeTruthy();
    expect(screen.getByText("4 en ligne")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ajuster" })).toBeNull();
  });

  it("uses the singular and hides empty counters", () => {
    render(<GameHuntingMetaBar meta={makeMeta({ minPlaythroughs: 1, missableCount: 1, onlineCount: 0 })} />);

    expect(screen.getByText("1 run min.")).toBeTruthy();
    expect(screen.getByText("1 manquable")).toBeTruthy();
    expect(screen.queryByText(/en ligne/)).toBeNull();
  });

  it("shows the warning matching its type", () => {
    const cases = [
      ["unobtainable", /Platine Inobtenable/],
      ["bugged", /Succès Buggés/],
      ["online-required", /Serveurs En Ligne/],
    ] as const;
    for (const [warningType, text] of cases) {
      render(<GameHuntingMetaBar meta={makeMeta({ warningType, warningMessage: "Détail" })} />);
      expect(screen.getByText(text).textContent).toContain("Détail");
      cleanup();
    }
  });

  it("labels a customised meta and toggles the editor", () => {
    render(<GameHuntingMetaBar meta={makeMeta({ isCustomOverride: true })} onSaveOverride={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "Infos personnalisées" });

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeTruthy();

    fireEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "Enregistrer" })).toBeNull();
  });

  it("saves a clamped override with the trimmed warning message, then closes the editor", () => {
    const onSaveOverride = vi.fn();
    render(<GameHuntingMetaBar meta={makeMeta()} onSaveOverride={onSaveOverride} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));

    fireEvent.change(numberInput("Difficulté (1-10)"), { target: { value: "15" } });
    fireEvent.change(numberInput("Durée 100% (h)"), { target: { value: "0" } });
    fireEvent.change(numberInput("Runs requis"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Alerte / Statut"), { target: { value: "bugged" } });
    fireEvent.change(screen.getByPlaceholderText(/Précision sur l'alerte/), { target: { value: "  Patch 1.2  " } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSaveOverride).toHaveBeenCalledWith({
      difficultyRating: 10,
      estimatedHours: 1,
      minPlaythroughs: 3,
      warningType: "bugged",
      warningMessage: "Patch 1.2",
    });
    expect(screen.queryByRole("button", { name: "Enregistrer" })).toBeNull();
  });

  it("omits an empty warning message from the override", () => {
    const onSaveOverride = vi.fn();
    render(<GameHuntingMetaBar meta={makeMeta()} onSaveOverride={onSaveOverride} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));

    expect(screen.queryByPlaceholderText(/Précision sur l'alerte/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSaveOverride).toHaveBeenCalledWith({
      difficultyRating: 7,
      estimatedHours: 80,
      minPlaythroughs: 2,
      warningType: "none",
    });
  });

  it("resets to the automatic meta or cancels without saving", () => {
    const onSaveOverride = vi.fn();
    render(<GameHuntingMetaBar meta={makeMeta()} onSaveOverride={onSaveOverride} />);

    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onSaveOverride).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));
    fireEvent.click(screen.getByRole("button", { name: "Auto" }));
    expect(onSaveOverride).toHaveBeenCalledWith(undefined);
    expect(screen.queryByRole("button", { name: "Auto" })).toBeNull();
  });
});
