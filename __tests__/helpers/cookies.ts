// __tests__/helpers/cookies.ts
export interface CookieRecord {
  readonly name: string;
  readonly value: string;
  readonly path?: string;
  readonly httpOnly?: boolean;
  readonly secure?: boolean;
  readonly maxAge?: number;
  readonly sameSite?: "lax" | "strict" | "none";
}
