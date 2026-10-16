// lib/epic/graphql-client.ts
import { EpicAuthError } from "./credentials";

export const EPIC_GRAPHQL_ENDPOINTS = [
  "https://graphql.epicgames.com/graphql",
  "https://launcher.store.epicgames.com/graphql",
];

export const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

export async function epicGraphQL<T = any>(
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
      const json = await res.json();
      if (json?.data) return json.data as T;
    } catch (err) {
      if (err instanceof EpicAuthError) throw err;
    }
  }
  return null;
}
