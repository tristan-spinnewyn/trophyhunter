// lib/epic/graphql-client.ts
import { EpicAuthError } from "./credentials";

export const EPIC_PRIMARY_GRAPHQL_ENDPOINT = "https://launcher.store.epicgames.com/graphql";

export const EPIC_GRAPHQL_ENDPOINTS: readonly string[] = [
  EPIC_PRIMARY_GRAPHQL_ENDPOINT,
  "https://graphql.epicgames.com/graphql",
];

export const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

export async function epicGraphQL<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string
): Promise<T | null> {
  for (const endpoint of EPIC_GRAPHQL_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": EPIC_USER_AGENT,
        },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 401 || res.status === 403) {
        throw new EpicAuthError();
      }
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: T };
      if (json?.data) return json.data;
    } catch (err) {
      if (err instanceof EpicAuthError) throw err;
    }
  }
  return null;
}

