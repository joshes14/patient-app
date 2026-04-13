import { NextRequest, NextResponse } from "next/server";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import {
  deletePatient,
  getPatientBundle,
  updatePatient,
  updatePatientReviewStatus,
} from "@/lib/repository";
import { patientPayloadSchema, patientStatusPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const bundle = await getPatientBundle(params.id);
  if (!bundle) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json(bundle);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = patientPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid patient payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const patient = await updatePatient(params.id, parsed.data);
    return NextResponse.json({ patient });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update patient." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = patientStatusPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid patient status payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (parsed.data.review_status !== "active" && parsed.data.review_status !== "archived") {
      return NextResponse.json({ error: "Unsupported patient status." }, { status: 400 });
    }

    const patient = await updatePatientReviewStatus(params.id, parsed.data.review_status);
    return NextResponse.json({ patient });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update patient status." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, `/api/patients/${encodeURIComponent(params.id)}`);
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const deleted = await deletePatient(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete patient." }, { status: 500 });
  }
}
