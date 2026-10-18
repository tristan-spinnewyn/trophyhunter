// __tests__/api/general/game.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/game/[id]/route";
import { jsonResponse, textResponse } from "../../helpers/responses";

describe("GET /api/game/[id] - Store HTML & Xbox", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENXBL_API_KEY;
  });

  it("rejects invalid non-numeric app IDs", async () => {
    const req = new Request("http://localhost:3000/api/game/abc");
    const params = Promise.resolve({ id: "abc" });
    const res = await GET(req, { params });
    expect(res.status).toBe(400);
  });

  it("parses store details and achievements with missable detection", async () => {
    const mockStoreData = {
      "367520": {
        data: {
          name: "Hollow Knight",
          header_image: "https://cdn.example.com/hk.jpg",
          short_description: "Metroidvania in Hallownest",
          developers: ["Team Cherry"],
          publishers: ["Team Cherry"],
        },
      },
    };

    const mockStatsHtml = `
      <div class="achieveRow">
        <img src="https://cdn.example.com/icon1.jpg">
        <h3>Fin secrète</h3>
        <h5>Découvrir toutes les fins sans mourir</h5>
        <div class="achievePercent">3.5%</div>
      </div>
      <div class="achieveRow">
        <img src="https://cdn.example.com/icon2.jpg">
        <h3>Succès secret</h3>
        <h5></h5>
        <div class="achievePercent">15%</div>
      </div>
    `;

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(mockStoreData))
      .mockResolvedValueOnce(textResponse(mockStatsHtml));

    const req = new Request("http://localhost:3000/api/game/367520");
    const params = Promise.resolve({ id: "367520" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(367520);
    expect(data.name).toBe("Hollow Knight");
    expect(data.totalAchievements).toBe(2);
    expect(data.achievements[0].missable).toBe(true);
    expect(data.achievements[0].percent).toBe(3.5);
    expect(data.achievements[1].hidden).toBe(true);
  });

  it("merges Xbox unlocked achievements when platform=xbox", async () => {
    process.env.OPENXBL_API_KEY = "test-xbl-key";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(
        jsonResponse({
          content: { profileUsers: [{ id: "2533274798129181", settings: [] }] },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          content: {
            achievements: [
              { id: "1", name: "Into the Starfield", progressState: "Achieved" },
              { id: "2", name: "One Small Step", progressState: "NotStarted" },
            ],
            pagingInfo: { totalRecords: 2 },
          },
        })
      );

    const req = new Request("http://localhost:3000/api/game/1715559203?platform=xbox");
    const res = await GET(req, { params: Promise.resolve({ id: "1715559203" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.achievementsSource).toBe("xbox");
    expect(data.totalAchievements).toBe(2);
    expect(data.unlockedIds).toEqual(["1"]);
  });
});
