// @vitest-environment jsdom
// __tests__/components/library/duplicates/DuplicatesPanel.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DuplicatesPanel from "@/components/library/DuplicatesPanel";
import { makeOwnedGame } from "../../../helpers/gameFixtures";

describe("DuplicatesPanel", () => {
  afterEach(cleanup);

  it("says when no duplicate was found", () => {
    render(<DuplicatesPanel duplicateGroups={[]} onSelectGame={vi.fn()} />);

    expect(screen.getByText("0 doublon(s) détecté(s)")).toBeTruthy();
    expect(screen.getByText("Aucun doublon trouvé")).toBeTruthy();
  });

  it("compares each copy of a game across platforms and opens the chosen one", () => {
    const onSelectGame = vi.fn();
    const group = {
      title: "Portal 2",
      games: [
        makeOwnedGame({ playtimeHours: 8, status: "completed" }),
        makeOwnedGame({ appId: 77, platform: "xbox", totalAchievements: 0, unlockedCount: 0 }),
      ],
    };
    render(<DuplicatesPanel duplicateGroups={[group]} onSelectGame={onSelectGame} />);

    expect(screen.getByText("2 plateformes")).toBeTruthy();
    expect(screen.getByText("40% (4/10)")).toBeTruthy();
    expect(screen.getByText("Sans succès")).toBeTruthy();
    expect(screen.getByText("8 h")).toBeTruthy();
    expect(screen.getByText("0 h")).toBeTruthy();

    fireEvent.click(screen.getAllByText("Ouvrir →")[1]);
    expect(onSelectGame).toHaveBeenCalledWith(77);
  });

  it("hides a cover image that fails to load", () => {
    render(<DuplicatesPanel duplicateGroups={[{ title: "Portal 2", games: [makeOwnedGame()] }]} onSelectGame={vi.fn()} />);
    const img = screen.getByAltText("Portal 2");

    fireEvent.error(img);

    expect(img.style.display).toBe("none");
  });
});
