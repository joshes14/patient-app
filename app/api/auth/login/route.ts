import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, checkPassword, checkPractitionerId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { practitionerId?: string; password?: string };
    const practitionerId = typeof body?.practitionerId === "string" ? body.practitionerId : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!checkPractitionerId(practitionerId)) {
      return NextResponse.json({ error: "Invalid practitioner ID." }, { status: 401 });
    }

    if (!checkPassword(practitionerId, password)) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "true",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  }
}
