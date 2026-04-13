import { NextRequest, NextResponse } from "next/server";
import { isBackendProxyMode, proxyRequestToBackend } from "@/lib/backend-client";
import { requireApiAuth } from "@/lib/auth";
import { createPatient, listPatients } from "@/lib/repository";
import { patientPayloadSchema } from "@/lib/validators";
import type { PatientReviewStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/patients");
  }

  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const sex = searchParams.get("sex") ?? "";
  const reviewStatusRaw = searchParams.get("review_status") ?? "all";
  const reviewStatus =
    reviewStatusRaw === "active" ||
    reviewStatusRaw === "archived"
      ? (reviewStatusRaw as PatientReviewStatus)
      : "all";

  const patients = await listPatients({ q, sex, review_status: reviewStatus });
  return NextResponse.json({ patients });
}

export async function POST(request: NextRequest) {
  if (isBackendProxyMode()) {
    return proxyRequestToBackend(request, "/api/patients");
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

    const patient = await createPatient(parsed.data);
    return NextResponse.json({ patient }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create patient." }, { status: 500 });
  }
}
