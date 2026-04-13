import { NextResponse } from "next/server";
import { proxyRequestToBackend, isBackendProxyMode } from "@/lib/backend-client";
import { createAuthCookieValue } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/auth/login");
  }

  try {
    const body = (await request.json()) as { practitionerId?: string; password?: string };
    const practitionerId = typeof body?.practitionerId === "string" ? body.practitionerId : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const { checkPassword, checkPractitionerId } = await import("@/lib/server/local-auth");

    if (!checkPractitionerId(practitionerId)) {
      return NextResponse.json({ error: "Invalid practitioner ID." }, { status: 401 });
    }

    if (!checkPassword(practitionerId, password)) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: "clinic_auth",
      value: createAuthCookieValue(practitionerId),
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
