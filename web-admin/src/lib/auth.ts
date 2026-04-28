// src/lib/auth.ts
// JWT creation, verification, and session cookie helpers.
// Uses the Web Crypto API (edge-compatible — works in Next.js middleware).

const SECRET = process.env.JWT_SECRET!; // must be ≥ 32 chars in .env.local
const COOKIE_NAME = "sr_session";
const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

// ─── helpers ────────────────────────────────────────────────────────────────

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

async function getKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(SECRET);
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, usage);
}

// ─── public types ────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;        // user uid
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// ─── sign ────────────────────────────────────────────────────────────────────

export async function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: JWTPayload = { ...payload, iat: now, exp: now + SESSION_SECONDS };

  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(new TextEncoder().encode(JSON.stringify(full)));
  const signingInput = `${header}.${body}`;

  const key = await getKey(["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64url(sig)}`;
}

// ─── verify ──────────────────────────────────────────────────────────────────

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const key = await getKey(["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64url(sig),
      new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(
      new TextDecoder().decode(decodeBase64url(body))
    );

    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired

    return payload;
  } catch {
    return null;
  }
}

// ─── cookie helpers (used in Route Handlers only, not middleware) ─────────────

export function buildSessionCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${SESSION_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(): string {
  // Mirror the same flags used in buildSessionCookie so the browser
  // accepts the clear-directive on the correct cookie binding.
  // SameSite=Strict on logout is safe — it's a destructive action and
  // we never need cross-site form submissions to reach this endpoint.
  return [
    `${COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export { COOKIE_NAME };