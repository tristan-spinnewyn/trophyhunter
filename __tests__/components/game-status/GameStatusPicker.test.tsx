// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GameStatusPicker } from "@/components/game-status/GameStatusPicker";

afterEach(cleanup);

describe("GameStatusPicker", () => {
  it("lists the five statuses as one radio group and checks the current one", () => {
    render(<GameStatusPicker status="paused" onChange={vi.fn()} />);

    const group = screen.getByRole("radiogroup", { name: "Statut du jeu" });
    expect(group).toBeTruthy();
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual([
      "À jouer",
      "En cours",
      "En pause",
      "Terminé",
      "Abandonné",
    ]);
    expect(screen.getByRole("radio", { name: "En pause" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "En cours" }).getAttribute("aria-checked")).toBe("false");
  });

  it("changes the status on click", () => {
    const onChange = vi.fn();
    render(<GameStatusPicker status="backlog" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: "Terminé" }));

    expect(onChange).toHaveBeenCalledWith("completed");
  });

  it("explains that picking a status adds a game that is not in the collection yet", () => {
    const onChange = vi.fn();
    render(<GameStatusPicker status={null} onChange={onChange} />);

    expect(screen.getByText("Choisis un statut pour l'ajouter à ta collection.")).toBeTruthy();
    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "En cours" }));
    expect(onChange).toHaveBeenCalledWith("in-progress");
  });

  it("moves between statuses with the arrow keys", () => {
    const onChange = vi.fn();
    render(<GameStatusPicker status="backlog" onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole("radio", { name: "À jouer" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("in-progress");

    fireEvent.keyDown(screen.getByRole("radio", { name: "À jouer" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("abandoned");
  });

  it("makes only the checked status reachable with Tab", () => {
    render(<GameStatusPicker status="completed" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Terminé" }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("radio", { name: "À jouer" }).getAttribute("tabindex")).toBe("-1");
  });
});
