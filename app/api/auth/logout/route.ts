import { NextResponse } from "next/server";
import { clearAuthCookieResponse } from "@/lib/auth";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/auth/logout");
  }

  return clearAuthCookieResponse(NextResponse.json({ ok: true }));
}
