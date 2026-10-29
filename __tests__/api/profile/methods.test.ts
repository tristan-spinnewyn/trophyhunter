// __tests__/api/profile/methods.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as epicRoute from "@/app/api/profile/epic/route";
import * as gogRoute from "@/app/api/profile/gog/route";
import * as steamRoute from "@/app/api/profile/steam/route";
import * as xboxRoute from "@/app/api/profile/xbox/route";
import { initDatabase, setDbForTesting } from "@/lib/db";

const routes = { epic: epicRoute, gog: gogRoute, steam: steamRoute, xbox: xboxRoute };

describe("/api/profile/* HTTP methods", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setDbForTesting(initDatabase(":memory:"));
  });

  it.each(Object.entries(routes))(
    "%s only accepts POST, so a cross-site link cannot trigger a sync that writes to the database",
    (_platform, route) => {
      expect(route).not.toHaveProperty("GET");
      expect(typeof route.POST).toBe("function");
    }
  );

  it.each(["steam", "xbox", "gog"] as const)(
    "%s ignores the user and the secret passed in the query string",
    async (platform) => {
      const fetchSpy = vi.spyOn(global, "fetch");
      const request = new Request(
        `http://localhost:3000/api/profile/${platform}?user=victim&key=leaked&token=leaked`,
        { method: "POST", body: "{}" }
      );

      const res = await routes[platform].POST(request);

      expect(res.status).toBe(400);
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  );
});
