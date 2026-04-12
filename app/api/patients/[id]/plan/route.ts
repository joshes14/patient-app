import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import {
  createTreatmentPlan,
  listTreatmentPlans,
  updateTreatmentPlan,
} from "@/lib/repository";
import { treatmentPlanPayloadSchema } from "@/lib/validators";

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

  try {
    const plans = listTreatmentPlans(params.id);
    return NextResponse.json({ plans });
  } catch (error) {
    // Log details for debugging during development
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to fetch treatment plans." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const normalized = {
      ...body,
      estimated_cost:
        typeof body?.estimated_cost === "number"
          ? body.estimated_cost
          : body?.estimated_cost
            ? Number.parseFloat(body.estimated_cost)
            : null,
    };

    const parsed = treatmentPlanPayloadSchema.safeParse(normalized);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid treatment plan payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const plan = createTreatmentPlan(params.id, parsed.data);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to create treatment plan." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = requireApiAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  const planId = new URL(request.url).searchParams.get("planId");
  if (!planId) {
    return NextResponse.json({ error: "Missing planId query parameter." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = treatmentPlanPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid treatment plan payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updated = updateTreatmentPlan(params.id, planId, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    return NextResponse.json({ plan: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update plan status." }, { status: 500 });
  }
}
