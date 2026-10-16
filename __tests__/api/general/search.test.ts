// __tests__/api/general/search.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/search/route";
import { jsonResponse } from "../../helpers/responses";

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty games array when query is missing", async () => {
    const req = new Request("http://localhost:3000/api/search");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.games).toEqual([]);
  });

  it("searches and formats steam store games", async () => {
    const mockItems = [
      {
        id: 1091500,
        name: "Cyberpunk 2077",
        tiny_image: "https://cdn.example.com/tiny.jpg",
        price: { final: 5999 },
      },
      {
        id: 1245620,
        name: "ELDEN RING",
        price: null,
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ items: mockItems }));

    const req = new Request("http://localhost:3000/api/search?q=cyberpunk");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.games.length).toBe(2);
    expect(data.games[0].id).toBe(1091500);
    expect(data.games[0].name).toBe("Cyberpunk 2077");
    expect(data.games[0].price).toBe("59.99 €");
    expect(data.games[1].price).toBeUndefined();
    expect(data.games[1].img).toContain("1245620/header.jpg");
  });

  it("handles external fetch failure gracefully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ error: "gateway" }, 502));

    const req = new Request("http://localhost:3000/api/search?q=error");
    const res = await GET(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
