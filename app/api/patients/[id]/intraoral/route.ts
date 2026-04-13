import { NextRequest, NextResponse } from "next/server";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import { getLatestIntraoralExam, upsertIntraoralExam } from "@/lib/repository";
import { intraoralPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}/intraoral`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const intraoralExam = await getLatestIntraoralExam(params.id);
  return NextResponse.json({ intraoralExam });
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}/intraoral`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = intraoralPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid intraoral payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const intraoralExam = await upsertIntraoralExam(params.id, parsed.data);
    return NextResponse.json({ intraoralExam });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to save intraoral exam." }, { status: 500 });
  }
}
