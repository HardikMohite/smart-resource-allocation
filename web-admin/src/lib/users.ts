// src/lib/users.ts
// Firestore helpers for creating and fetching users.
// Passwords are hashed with bcrypt (cost factor 12) — NOT SHA-256.
// bcrypt is intentionally slow and GPU-resistant, making brute-force infeasible.

import bcrypt from "bcryptjs";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export interface AppUser {
  uid: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  passwordHash: string; // bcrypt hash (includes salt internally)
  createdAt: string;    // ISO-8601
}

// ─── password hashing (bcrypt, cost=12) ──────────────────────────────────────
// bcrypt embeds the salt inside the hash string — no separate salt field needed.
// Cost factor 12 means ~250ms per hash, making offline brute-force impractical.

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── create user ─────────────────────────────────────────────────────────────

export async function createUser(
  data: Omit<AppUser, "uid" | "passwordHash" | "createdAt"> & { password: string }
): Promise<{ user: AppUser } | { error: string }> {
  // check duplicate email
  const existing = await getDocs(
    query(collection(db, "users"), where("email", "==", data.email))
  );
  if (!existing.empty) return { error: "Email already registered." };

  const uid = crypto.randomUUID();
  const passwordHash = await hashPassword(data.password);

  const user: AppUser = {
    uid,
    name: data.name,
    age: data.age,
    phone: data.phone,
    email: data.email,
    gender: data.gender,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", uid), user);
  return { user };
}

// ─── find user by email ───────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const snap = await getDocs(
    query(collection(db, "users"), where("email", "==", email))
  );
  if (snap.empty) return null;
  return snap.docs[0].data() as AppUser;
}

// ─── verify credentials (constant-time) ──────────────────────────────────────
// `dummyHash` is required so we always run bcrypt.compare regardless of whether
// the email exists. Without this, a missing-user path returns ~0 ms while a
// found-user path takes ~250 ms (bcrypt cost=12), leaking which emails exist.

export async function verifyCredentials(
  email: string,
  password: string,
  dummyHash: string
): Promise<AppUser | null> {
  const user = await getUserByEmail(email);

  // Always compare — use the real hash if we found the user, dummy otherwise.
  const hashToCompare = user ? user.passwordHash : dummyHash;
  const valid = await verifyPassword(password, hashToCompare);

  // Only return the user if both the account exists AND the password matched.
  if (!user || !valid) return null;

  return user;
}