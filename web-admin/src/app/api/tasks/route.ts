// src/app/api/tasks/route.ts
// Returns the full task list for the authenticated dashboard.
// assigned_volunteer_phone is ONLY returned here — never in client-side Firestore reads.

import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/firebase-admin"; // server-only Admin SDK instance
import { collection, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
  // Auth check — require a valid session cookie
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDocs(collection(db, "tasks"));
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[tasks]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
