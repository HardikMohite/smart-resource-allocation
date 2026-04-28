// src/app/api/auth/logout/route.ts
// Clears the session cookie.
//
// CSRF protection: we require the caller to send the header
//   X-Requested-With: XMLHttpRequest
// This is a simple "custom header" CSRF defence. Cross-origin requests from
// a malicious page cannot add arbitrary headers without a CORS pre-flight,
// which our server never approves. The browser's own fetch/XHR from our
// origin sends this header automatically when we set it.

import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Reject requests that don't carry our custom CSRF sentinel header.
  // Legitimate clients (our own JS) always send this; cross-origin form
  // submissions and <img> tags cannot.
  const csrfHeader = req.headers.get("x-requested-with");
  if (csrfHeader !== "XMLHttpRequest") {
    return NextResponse.json(
      { error: "Forbidden — missing CSRF header." },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
