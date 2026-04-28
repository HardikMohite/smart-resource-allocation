// src/app/api/auth/me/route.ts
// Returns the currently logged-in user from the JWT cookie.

import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const payload = await verifyJWT(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: { uid: payload.sub, email: payload.email, name: payload.name },
  });
}
