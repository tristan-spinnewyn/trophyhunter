// __tests__/api/general/game_schema.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/[id]/route";
import { jsonResponse, textResponse } from "../../helpers/responses";

describe("GET /api/game/[id] - WebAPI Schema", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses official Steam WebAPI schema with localized details", async () => {
    const mockStoreData = {
      "1517290": {
        data: {
          name: "Battlefield™ 2042",
          header_image: "https://cdn.example.com/bf2042.jpg",
          developers: ["DICE"],
          publishers: ["Electronic Arts"],
        },
      },
    };

    const mockSchemaJson = {
      response: {
        achievements: [
          {
            internal_name: "Achievement_1",
            localized_name: "Premier Pas",
            localized_desc: "Niveau 5",
            icon: "icon1.jpg",
            hidden: false,
            player_percent_unlocked: "67.4",
          },
        ],
      },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(mockStoreData))
      .mockResolvedValueOnce(textResponse(JSON.stringify(mockSchemaJson)));

    const req = new Request("http://localhost:3000/api/game/1517290");
    const params = Promise.resolve({ id: "1517290" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(1517290);
    expect(data.totalAchievements).toBe(1);
    expect(data.achievements[0].name).toBe("Premier Pas");
    expect(data.achievements[0].percent).toBe(67.4);
  });
});
