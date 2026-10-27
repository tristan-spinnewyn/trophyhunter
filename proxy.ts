// proxy.ts
import type { NextRequest } from "next/server";
import { enforceSameOriginForMutations } from "@/lib/security/same-origin-policy";

export function proxy(request: NextRequest) {
  return enforceSameOriginForMutations(request);
}

export const config = {
  matcher: "/api/:path*",
};
