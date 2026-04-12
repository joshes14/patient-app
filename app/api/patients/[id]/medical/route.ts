import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getMedicalHistory, upsertMedicalHistory } from "@/lib/repository";
import { medicalHistoryPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const medicalHistory = getMedicalHistory(params.id);
  return NextResponse.json({ medicalHistory });
}

export async function PUT(request: NextRequest, { params }: Context) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = medicalHistoryPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid medical history payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const medicalHistory = upsertMedicalHistory(params.id, parsed.data);
    return NextResponse.json({ medicalHistory });
  } catch (error) {
    // Log details for debugging during development
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to save medical history." }, { status: 500 });
  }
}
