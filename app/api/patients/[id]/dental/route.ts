import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getDentalHistory, upsertDentalHistory } from "@/lib/repository";
import { dentalHistoryPayloadSchema } from "@/lib/validators";

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

  const dentalHistory = getDentalHistory(params.id);
  return NextResponse.json({ dentalHistory });
}

export async function PUT(request: NextRequest, { params }: Context) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = dentalHistoryPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid dental history payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const dentalHistory = upsertDentalHistory(params.id, parsed.data);
    return NextResponse.json({ dentalHistory });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to save dental history." }, { status: 500 });
  }
}
