import { NextRequest, NextResponse } from "next/server";
import { proxyRequestToBackend, isBackendProxyMode } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import { getAppSettings, updateAppSettings } from "@/lib/repository";
import { appSettingsPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/settings");
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/settings");
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = appSettingsPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid settings payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const settings = await updateAppSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
