// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/users";
import { signJWT, buildSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

// ── Rate-limit config ────────────────────────────────────────────────────────
// 10 attempts per IP per 15 minutes.
const RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

// A real bcrypt hash used as a dummy target so failed lookups take the same
// time as successful ones, defeating email-enumeration timing attacks.
// Generated once with: bcrypt.hashSync("__dummy__", 12)
const DUMMY_HASH =
  "$2a$12$eSHiWdJDHEoEPgfPYBOCf.7hFMbhDKTKN4BLHmFzXCCf3.0Hq9p6q";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limiting ───────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`, RATE_LIMIT);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // ── 2. Constant-time lookup to prevent timing-based email enumeration ───
    // We always run a bcrypt.compare — even when the user doesn't exist —
    // so the response time is indistinguishable for valid vs. invalid emails.
    const user = await verifyCredentials(
      email.trim().toLowerCase(),
      password,
      DUMMY_HASH
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signJWT({
      sub: user.uid,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      user: { uid: user.uid, email: user.email, name: user.name },
    });

    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
