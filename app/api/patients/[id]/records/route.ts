import { NextRequest, NextResponse } from "next/server";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import { createTreatmentRecord, listTreatmentRecords } from "@/lib/repository";
import { treatmentRecordPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}/records`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const records = await listTreatmentRecords(params.id);
    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to fetch treatment records." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}/records`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = treatmentRecordPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid treatment record payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const record = await createTreatmentRecord(params.id, parsed.data);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to create treatment record." }, { status: 500 });
  }
}
