// __tests__/epic/graphql_client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EpicAuthError } from "@/lib/epic/credentials";
import {
  EPIC_GRAPHQL_ENDPOINTS,
  EPIC_PRIMARY_GRAPHQL_ENDPOINT,
  EPIC_USER_AGENT,
  epicGraphQL,
  postEpicGraphQL,
} from "@/lib/epic/graphql";
import { jsonResponse } from "../helpers/responses";

describe("epicGraphQL", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the next endpoint when the primary one errors", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    expect(await epicGraphQL("query Q { ok }", {}, "tok")).toEqual({ ok: true });
    expect(fetchSpy.mock.calls.map((c) => c[0])).toEqual([...EPIC_GRAPHQL_ENDPOINTS]);
  });

  it("returns null when every endpoint errors", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503))
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503));

    expect(await epicGraphQL("query Q { ok }", {}, "tok")).toBeNull();
  });

  it("throws EpicAuthError when the token is rejected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));

    await expect(epicGraphQL("query Q { ok }", {}, "expired")).rejects.toBeInstanceOf(EpicAuthError);
  });
});

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
