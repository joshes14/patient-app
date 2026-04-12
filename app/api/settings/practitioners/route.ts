import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createPractitioner, listPractitioners } from "@/lib/repository";
import { practitionerPayloadSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const practitioners = listPractitioners();
  return NextResponse.json({ practitioners });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const parsed = practitionerPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid practitioner payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const practitioner = createPractitioner(parsed.data);
    return NextResponse.json({ practitioner }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
      return NextResponse.json({ error: "Practitioner ID already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create practitioner." }, { status: 500 });
  }
}
