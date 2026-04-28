// src/app/api/tasks/[id]/call/route.ts
// Server-side redirect to tel: — never exposes the phone number in HTML source
// or client-side JS. Only authenticated users can reach this endpoint.

import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // Require a valid session
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDoc(doc(db, "tasks", id));
    if (!snap.exists()) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const phone = snap.data()?.assigned_volunteer_phone as string | undefined;
    if (!phone) {
      return NextResponse.json({ error: "No phone number on file." }, { status: 404 });
    }

    // Redirect to tel: — the phone number never touches the browser DOM
    return NextResponse.redirect(`tel:${phone}`);
  } catch (err) {
    console.error("[call]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
