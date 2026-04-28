// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/users";
import { signJWT, buildSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

// 5 registrations per IP per hour — generous for real users, blocks mass creation.
const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
function isStrongPassword(pwd: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limiting ───────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMIT);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { name, age, phone, email, gender, password, confirmPassword } = body;

    // ── validation ────────────────────────────────────────────────────────────
    if (!name || !age || !phone || !email || !gender || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      return NextResponse.json({ error: "Age must be between 13 and 120." }, { status: 400 });
    }

    if (!/^\+?[0-9\s\-()]{7,15}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must be 8+ characters and include uppercase, lowercase, number, and special character." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // ── create user ───────────────────────────────────────────────────────────
    const result = await createUser({
      name: name.trim(),
      age: parsedAge,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      gender,
      password,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const { user } = result;
    const token = await signJWT({ sub: user.uid, email: user.email, name: user.name });

    const res = NextResponse.json({
      user: { uid: user.uid, email: user.email, name: user.name },
    });

    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
