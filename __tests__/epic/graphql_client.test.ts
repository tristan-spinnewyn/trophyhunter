// __tests__/epic/graphql_client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EPIC_PRIMARY_GRAPHQL_ENDPOINT, EPIC_USER_AGENT, postEpicGraphQL } from "@/lib/epic/graphql";
import { jsonResponse } from "../helpers/responses";

describe("postEpicGraphQL", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the query as JSON with launcher headers and a bearer token", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ data: {} }));

    const res = await postEpicGraphQL(EPIC_PRIMARY_GRAPHQL_ENDPOINT, "query Q { a }", { id: 1 }, "tok_g");

    expect(res.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(EPIC_PRIMARY_GRAPHQL_ENDPOINT);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tok_g",
      "User-Agent": EPIC_USER_AGENT,
    });
    expect(JSON.parse(String(init?.body))).toEqual({ query: "query Q { a }", variables: { id: 1 } });
  });
});
