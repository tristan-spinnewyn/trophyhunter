// @vitest-environment jsdom
// __tests__/components/achievement/AchievementItem.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AchievementItem from "@/components/achievement/AchievementItem";
import type { AchievementItemProps } from "@/components/achievement/AchievementItem.types";
import { HIDDEN_ACHIEVEMENT_TEXT } from "@/components/achievement/achievementDescription";
import { makeAchievement } from "../../helpers/gameFixtures";

function renderItem(overrides: Partial<AchievementItemProps> = {}) {
  const props: AchievementItemProps = {
    achievement: makeAchievement(),
    gameName: "Portal 2",
    gameId: 620,
    isUnlocked: false,
    notes: "",
    revealSecret: false,
    onToggleUnlocked: vi.fn(),
    onSaveNotes: vi.fn(),
    ...overrides,
  };
  render(<AchievementItem {...props} />);
  return props;
}

describe("AchievementItem", () => {
  afterEach(cleanup);

  it("shows the achievement with its rarity and toggles it as unlocked", () => {
    const props = renderItem();

    const checkbox = screen.getByRole("checkbox", { name: "Wake Up Call" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText(/42.5% •/)).toBeTruthy();
    expect(screen.getByText("Survive the manual override.")).toBeTruthy();
    fireEvent.click(checkbox);

    expect(props.onToggleUnlocked).toHaveBeenCalled();
  });

  it("flags pinned, missable, secret and annotated achievements", () => {
    renderItem({
      achievement: makeAchievement({ missable: true, hidden: true }),
      isPinned: true,
      notes: "Chapter 3",
      onTogglePinned: vi.fn(),
    });

    for (const flag of ["Cible", "Manquable", "Secret", "Note"]) {
      expect(screen.getByText(flag)).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Retirer de la chasse active" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("masks a secret description until revealed or unlocked", () => {
    renderItem({ achievement: makeAchievement({ hidden: true }) });
    expect(screen.getByText(HIDDEN_ACHIEVEMENT_TEXT)).toBeTruthy();
    cleanup();

    renderItem({ achievement: makeAchievement({ hidden: true }), isUnlocked: true });
    expect(screen.getByText("Survive the manual override.")).toBeTruthy();
  });

  it("pins the achievement as an active hunt target", () => {
    const onTogglePinned = vi.fn();
    renderItem({ onTogglePinned });

    fireEvent.click(screen.getByRole("button", { name: "Épingler en chasse active" }));

    expect(onTogglePinned).toHaveBeenCalled();
  });

  it("hides the pin without a pin handler", () => {
    renderItem();

    expect(screen.queryByRole("button", { name: "Épingler en chasse active" })).toBeNull();
  });

  it("expands to guides and notes from the toggle or the title, and saves notes as typed", () => {
    const props = renderItem({ notes: "First" });

    fireEvent.click(screen.getByRole("button", { name: "Voir le guide & notes" }));
    expect(screen.getByRole("link", { name: /Guides Steam/ }).getAttribute("href")).toContain("/app/620/guides/");
    const textarea = screen.getByPlaceholderText(/Obtenu au Chapitre 3/) as HTMLTextAreaElement;
    expect(textarea.value).toBe("First");

    fireEvent.change(textarea, { target: { value: "First try" } });
    expect(props.onSaveNotes).toHaveBeenCalledWith("First try");
    expect(textarea.value).toBe("First try");

    fireEvent.click(screen.getByRole("heading", { name: "Wake Up Call" }));
    expect(screen.queryByPlaceholderText(/Obtenu au Chapitre 3/)).toBeNull();
    expect(screen.getByRole("button", { name: "Voir le guide & notes" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("hides an icon that fails to load", () => {
    renderItem();
    const img = screen.getByAltText("Wake Up Call");

    fireEvent.error(img);

    expect(img.style.display).toBe("none");
  });
});
