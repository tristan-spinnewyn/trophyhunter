// __tests__/api/general/game_search.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/[id]/route";
import { jsonResponse, textResponse } from "../../helpers/responses";

describe("GET /api/game/[id] External Resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches Steam by name when non-Steam appId is provided", async () => {
    const mockSearchResults = { items: [{ id: 504230, name: "Celeste" }] };
    const mockSecondaryStore = {
      "504230": {
        data: {
          name: "Celeste",
          header_image: "https://cdn.example.com/celeste.jpg",
          developers: ["Extremely OK Games"],
        },
      },
    };
    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: "CH1_COMPLETE",
            localized_name: "Cité abandonnée",
            localized_desc: "Chapitre 1",
            icon: "icon.jpg",
            hidden: false,
            player_percent_unlocked: "80.0",
          },
        ],
      },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(mockSearchResults))
      .mockResolvedValueOnce(jsonResponse(mockSecondaryStore))
      .mockResolvedValueOnce(textResponse(JSON.stringify(mockSchemaJson)));

    const req = new Request("http://localhost:3000/api/game/99999999?name=Celeste&platform=epic");
    const params = Promise.resolve({ id: "99999999" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(99999999);
    expect(data.name).toBe("Celeste");
    expect(data.totalAchievements).toBe(1);
  });

  it("supports fast mode with direct smart title matching", async () => {
    const mockSearchResults = {
      items: [
        { id: 111111, name: "Hades Soundtrack" },
        { id: 1145360, name: "Hades", tiny_image: "https://cdn.example.com/tiny.jpg" },
      ],
    };
    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: "ACH_1",
            localized_name: "Évasion",
            localized_desc: "Tartare",
            icon: "ach1.jpg",
            hidden: false,
            player_percent_unlocked: "75.2",
          },
        ],
      },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(mockSearchResults))
      .mockResolvedValueOnce(textResponse(JSON.stringify(mockSchemaJson)));

    const req = new Request("http://localhost:3000/api/game/88888888?name=Hades%20Edition&platform=epic&fast=1");
    const params = Promise.resolve({ id: "88888888" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(88888888);
    expect(data.totalAchievements).toBe(1);
  });
});
