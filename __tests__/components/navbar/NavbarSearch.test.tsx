// @vitest-environment jsdom
// __tests__/components/navbar/NavbarSearch.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { jsonResponse } from "../../helpers/responses";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { NavbarSearch, POPULAR_GAMES } = await import("@/components/navbar/NavbarSearch");

function searchBox() {
  return screen.getByRole("textbox", { name: "Rechercher un jeu" });
}

describe("NavbarSearch", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    push.mockClear();
  });

  it("suggests popular games on focus and opens the picked one", () => {
    const onSelectGame = vi.fn();
    render(<NavbarSearch onSelectGame={onSelectGame} />);

    fireEvent.focus(searchBox());
    expect(screen.getByText("Jeux populaires")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(POPULAR_GAMES[0].name) }));

    expect(onSelectGame).toHaveBeenCalledWith(POPULAR_GAMES[0].id);
    expect(push).toHaveBeenCalledWith(`/game/${POPULAR_GAMES[0].id}`);
    expect(screen.queryByText("Jeux populaires")).toBeNull();
  });

  it("searches Steam as the user types and lists the results", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ games: [{ id: 620, name: "Portal 2", img: "https://example.test/p2.jpg" }] }));
    render(<NavbarSearch />);

    fireEvent.change(searchBox(), { target: { value: "portal" } });

    expect(await screen.findByText("AppID: 620")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith("/api/search?q=portal");
    fireEvent.click(screen.getByRole("button", { name: /Portal 2/ }));
    expect(push).toHaveBeenCalledWith("/game/620");
  });

  it("says when nothing matches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ games: [] }));
    render(<NavbarSearch />);

    fireEvent.change(searchBox(), { target: { value: "zzzz" } });

    expect(await screen.findByText('Aucun jeu trouvé pour "zzzz".')).toBeTruthy();
  });

  it("clears the search", () => {
    render(<NavbarSearch />);

    fireEvent.change(searchBox(), { target: { value: "p" } });
    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));

    expect((searchBox() as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("button", { name: "Effacer la recherche" })).toBeNull();
  });

  it("closes the suggestions on a click outside", () => {
    render(<NavbarSearch />);

    fireEvent.focus(searchBox());
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Jeux populaires")).toBeNull();
  });
});
