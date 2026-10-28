// @vitest-environment jsdom
// __tests__/components/hunting/ActiveHuntPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { ActiveHuntPanel } from "@/components/hunting/ActiveHuntPanel";
import { MAX_PINNED_TARGETS } from "@/lib/hunting/pinned-targets.services";
import { makeAchievement } from "../../helpers/gameFixtures";

const first = makeAchievement({ id: "a1", name: "First", missable: true });
const second = makeAchievement({ id: "a2", name: "Second" });

function renderPanel(overrides: Partial<ComponentProps<typeof ActiveHuntPanel>> = {}) {
  const props: ComponentProps<typeof ActiveHuntPanel> = {
    pinnedAchievements: [first, second],
    unlockedIds: [],
    notes: {},
    onToggleUnlocked: vi.fn(),
    onUnpin: vi.fn(),
    onClearUnlocked: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  };
  render(<ActiveHuntPanel {...props} />);
  return props;
}

describe("ActiveHuntPanel", () => {
  afterEach(cleanup);

  it("explains how to pin targets while none is pinned", () => {
    renderPanel({ pinnedAchievements: [] });

    expect(screen.getByText(new RegExp(`jusqu'à ${MAX_PINNED_TARGETS} succès`))).toBeTruthy();
  });

  it("lists the pinned targets with their rarity, missable flag and note", () => {
    renderPanel({ notes: { a2: "After chapter 3" } });

    expect(screen.getByText(`2 / ${MAX_PINNED_TARGETS}`)).toBeTruthy();
    expect(screen.getAllByText("42.5%")).toHaveLength(2);
    expect(screen.getAllByText(/Manquable/)).toHaveLength(1);
    expect(screen.getByText("📝 After chapter 3")).toBeTruthy();
  });

  it("validates and unpins a target", () => {
    const props = renderPanel();

    fireEvent.click(screen.getAllByTitle("Valider la cible")[1]);
    fireEvent.click(screen.getAllByTitle("Retirer de la chasse active")[0]);

    expect(props.onToggleUnlocked).toHaveBeenCalledWith("a2");
    expect(props.onUnpin).toHaveBeenCalledWith("a1");
  });

  it("clears the unlocked targets only when some are unlocked", () => {
    renderPanel();
    expect(screen.queryByRole("button", { name: /Retirer obtenus/ })).toBeNull();
    cleanup();

    const props = renderPanel({ unlockedIds: ["a1"] });
    expect(screen.getByTitle("Marquer non obtenu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Retirer obtenus/ }));
    fireEvent.click(screen.getByRole("button", { name: /Vider/ }));

    expect(props.onClearUnlocked).toHaveBeenCalled();
    expect(props.onClearAll).toHaveBeenCalled();
  });
});
