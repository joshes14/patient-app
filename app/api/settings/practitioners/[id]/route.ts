import { NextRequest, NextResponse } from "next/server";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import {
  deactivatePractitioner,
  updatePractitionerPassword,
} from "@/lib/repository";
import { practitionerPasswordPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/settings/practitioners/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = practitionerPasswordPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid practitioner password payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const practitioner = await updatePractitionerPassword(params.id, parsed.data.password);
    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found." }, { status: 404 });
    }

    return NextResponse.json({ practitioner });
  } catch {
    return NextResponse.json({ error: "Unable to update practitioner password." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/settings/practitioners/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const practitioner = await deactivatePractitioner(params.id);
    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found." }, { status: 404 });
    }

    return NextResponse.json({ practitioner });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACTIVE_PRACTITIONER") {
      return NextResponse.json(
        { error: "At least one active practitioner must remain." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Unable to deactivate practitioner." }, { status: 500 });
  }
}
