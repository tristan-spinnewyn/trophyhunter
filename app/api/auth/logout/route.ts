import { NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthSessionCookie();
  return NextResponse.json({ success: true }, { status: 200 });
}
