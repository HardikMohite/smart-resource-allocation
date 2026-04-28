// middleware.ts  (place at project root, next to package.json)
// Runs on every request BEFORE the page renders.
// Protects /dashboard and /track/* — redirects to /login if no valid session.

import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, COOKIE_NAME } from "./src/lib/auth";

const PROTECTED = ["/dashboard", "/track"];
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Validates that `from` is a safe internal relative path.
 * Rejects anything that:
 *  - starts with "//" (protocol-relative URL, e.g. //evil.com)
 *  - contains ":" before the first "/" (absolute URL like https://evil.com)
 *  - is empty or not a string
 * Returns the path if safe, or "/dashboard" as a fallback.
 */
function sanitizeRedirectPath(from: string | null): string {
  if (!from || typeof from !== "string") return "/dashboard";
  // Must start with a single "/" and contain no protocol
  if (!/^\/[^/]/.test(from) && from !== "/") return "/dashboard";
  // Extra guard: reject if a colon appears before the first slash
  const colonIdx = from.indexOf(":");
  const slashIdx = from.indexOf("/");
  if (colonIdx !== -1 && colonIdx < slashIdx) return "/dashboard";
  return from;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

  // Unauthenticated user trying to access protected route → redirect to login
  if (isProtected && !payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // Only preserve internal paths — sanitized to prevent open redirect
    url.searchParams.set("from", sanitizeRedirectPath(pathname));
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to visit login/register → send to dashboard
  if (isAuthRoute && payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("from");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - /api/* (API routes handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};