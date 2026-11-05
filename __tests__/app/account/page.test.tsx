// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { makeOwnedGame } from "../../helpers/gameFixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/accounts/AccountDashboard", () => ({ default: () => <div data-testid="dashboard" /> }));

const userData = {
  accountProfile: { displayName: "Moi", accounts: {} as Record<string, unknown> },
  setAccountProfile: vi.fn(),
  ownedGames: [makeOwnedGame()],
  setOwnedGames: vi.fn(),
  setSteamUser: vi.fn(),
  currentUser: null,
  steamApiKey: "",
};
vi.mock("@/context/UserDataContext", () => ({ useUserData: () => userData }));

import AccountPage from "@/app/account/page";

afterEach(cleanup);

describe("AccountPage", () => {
  it("titles the page and says how many accounts feed the collection", () => {
    userData.accountProfile.accounts = { steam: { username: "gaben" } };
    render(<AccountPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Mes comptes" })).toBeTruthy();
    expect(screen.getByText(/1 compte lié sur 4\. Ils remplissent ta collection de 1 jeu/)).toBeTruthy();
    expect(screen.getByTestId("dashboard")).toBeTruthy();
  });

  it("uses the plural for several accounts and games", () => {
    userData.accountProfile.accounts = { steam: { username: "a" }, xbox: { username: "b" } };
    userData.ownedGames = [makeOwnedGame(), makeOwnedGame({ appId: 400 })];
    render(<AccountPage />);

    expect(screen.getByText(/2 comptes liés sur 4\. Ils remplissent ta collection de 2 jeux/)).toBeTruthy();
  });
});
