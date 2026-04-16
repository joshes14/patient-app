import { buildAuthCookieHeader, buildClearAuthCookieHeader, requireApiAuth } from "./auth";
import {
  checkPassword,
  checkPractitionerId,
  createPatient,
  createPractitioner,
  createTreatmentPlan,
  deleteTreatmentPlan,
  createTreatmentRecord,
  deactivatePractitioner,
  ensureSeedData,
  getAppSettings,
  getDentalHistory,
  getLatestIntraoralExam,
  getMedicalHistory,
  getPatientBundle,
  deletePatient,
  listPatients,
  listPractitioners,
  listTreatmentPlans,
  listTreatmentRecords,
  updateAppSettings,
  updatePatient,
  updatePatientReviewStatus,
  updatePractitionerPassword,
  upsertDentalHistory,
  upsertIntraoralExam,
  upsertMedicalHistory,
  updateTreatmentPlan,
} from "./repository";
import { json, notFound } from "./utils";
import type { Env } from "./db";
import {
  appSettingsPayloadSchema,
  dentalHistoryPayloadSchema,
  intraoralPayloadSchema,
  medicalHistoryPayloadSchema,
  patientPayloadSchema,
  patientStatusPayloadSchema,
  practitionerPasswordPayloadSchema,
  practitionerPayloadSchema,
  treatmentPlanPayloadSchema,
  treatmentRecordPayloadSchema,
} from "./validators";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const jsonWithCors = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return json(data, {
    ...init,
    headers,
  });
};

const responseWithCookie = (data: unknown, cookie?: string, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  if (cookie) {
    headers.append("Set-Cookie", cookie);
  }

  return jsonWithCors(data, { ...init, headers });
};

const parseJson = async <T>(request: Request): Promise<T> => (await request.json()) as T;

const isSecureRequest = (request: Request): boolean => new URL(request.url).protocol === "https:";

const handleAuthLogin = async (request: Request, env: Env): Promise<Response> => {
  try {
    const body = await parseJson<{ practitionerId?: string; password?: string }>(request);
    const practitionerId = typeof body?.practitionerId === "string" ? body.practitionerId : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!(await checkPractitionerId(env, practitionerId))) {
      return jsonWithCors({ error: "Invalid practitioner ID." }, { status: 401 });
    }

    if (!(await checkPassword(env, practitionerId, password))) {
      return jsonWithCors({ error: "Invalid password." }, { status: 401 });
    }

    const cookie = buildAuthCookieHeader(practitionerId, env, isSecureRequest(request));
    return responseWithCookie({ ok: true }, cookie);
  } catch {
    return jsonWithCors({ error: "Invalid login request." }, { status: 400 });
  }
};

const handleAuthLogout = async (request: Request): Promise<Response> => {
  return responseWithCookie({ ok: true }, buildClearAuthCookieHeader(isSecureRequest(request)));
};

const routeSettings = async (request: Request, env: Env, path: string): Promise<Response> => {
  if (request.method === "GET" && path === "/api/settings") {
    const settings = await getAppSettings(env);
    return jsonWithCors({ settings });
  }

  if (request.method === "PUT" && path === "/api/settings") {
    const auth = requireApiAuth(request, env);
    if (auth) return auth;

    try {
      const parsed = appSettingsPayloadSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonWithCors(
          { error: "Invalid settings payload.", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const settings = await updateAppSettings(env, parsed.data);
      return jsonWithCors({ settings });
    } catch {
      return jsonWithCors({ error: "Unable to update settings." }, { status: 500 });
    }
  }

  if (request.method === "GET" && path === "/api/settings/practitioners") {
    const auth = requireApiAuth(request, env);
    if (auth) return auth;

    const practitioners = await listPractitioners(env);
    return jsonWithCors({ practitioners });
  }

  if (request.method === "POST" && path === "/api/settings/practitioners") {
    const auth = requireApiAuth(request, env);
    if (auth) return auth;

    try {
      const parsed = practitionerPayloadSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonWithCors(
          { error: "Invalid practitioner payload.", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const practitioner = await createPractitioner(env, parsed.data);
      return jsonWithCors({ practitioner }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
        return jsonWithCors({ error: "Practitioner ID already exists." }, { status: 409 });
      }

      return jsonWithCors({ error: "Unable to create practitioner." }, { status: 500 });
    }
  }

  const practitionerMatch = path.match(/^\/api\/settings\/practitioners\/([^/]+)$/);
  if (practitionerMatch) {
    const auth = requireApiAuth(request, env);
    if (auth) return auth;

    const practitionerId = decodeURIComponent(practitionerMatch[1]);

    if (request.method === "PATCH") {
      try {
        const parsed = practitionerPasswordPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid practitioner password payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const practitioner = await updatePractitionerPassword(env, practitionerId, parsed.data.password);
        if (!practitioner) {
          return jsonWithCors({ error: "Practitioner not found." }, { status: 404 });
        }

        return jsonWithCors({ practitioner });
      } catch {
        return jsonWithCors({ error: "Unable to update practitioner password." }, { status: 500 });
      }
    }

    if (request.method === "DELETE") {
      try {
        const practitioner = await deactivatePractitioner(env, practitionerId);
        if (!practitioner) {
          return jsonWithCors({ error: "Practitioner not found." }, { status: 404 });
        }

        return jsonWithCors({ practitioner });
      } catch (error) {
        if (error instanceof Error && error.message === "LAST_ACTIVE_PRACTITIONER") {
          return jsonWithCors(
            { error: "At least one active practitioner must remain." },
            { status: 409 },
          );
        }

        return jsonWithCors({ error: "Unable to deactivate practitioner." }, { status: 500 });
      }
    }

  }

  return notFound("Route not implemented yet in Worker backend.");
};

const routePatients = async (request: Request, env: Env, path: string): Promise<Response> => {
  const auth = requireApiAuth(request, env);
  if (auth) return auth;

  if (request.method === "GET" && path === "/api/patients") {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const sex = url.searchParams.get("sex") ?? "";
    const reviewStatusRaw = url.searchParams.get("review_status") ?? "all";
    const reviewStatus = reviewStatusRaw === "active" || reviewStatusRaw === "archived" ? reviewStatusRaw : "all";

    const patients = await listPatients(env, { q, sex, review_status: reviewStatus });
    return jsonWithCors({ patients });
  }

  if (request.method === "POST" && path === "/api/patients") {
    try {
      const parsed = patientPayloadSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonWithCors({ error: "Invalid patient payload.", issues: parsed.error.flatten() }, { status: 400 });
      }

      const patient = await createPatient(env, parsed.data);
      return jsonWithCors({ patient }, { status: 201 });
    } catch {
      return jsonWithCors({ error: "Unable to create patient." }, { status: 500 });
    }
  }

  const patientMatch = path.match(/^\/api\/patients\/([^/]+)(.*)$/);
  if (!patientMatch) {
    return notFound("Route not implemented yet in Worker backend.");
  }

  const patientId = decodeURIComponent(patientMatch[1]);
  const suffix = patientMatch[2] || "";

  if (suffix === "") {
    if (request.method === "GET") {
      const bundle = await getPatientBundle(env, patientId);
      if (!bundle) {
        return jsonWithCors({ error: "Patient not found." }, { status: 404 });
      }

      return jsonWithCors(bundle);
    }

    if (request.method === "PUT") {
      try {
        const parsed = patientPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors({ error: "Invalid patient payload.", issues: parsed.error.flatten() }, { status: 400 });
        }

        const patient = await updatePatient(env, patientId, parsed.data);
        return jsonWithCors({ patient });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to update patient." }, { status: 500 });
      }
    }

    if (request.method === "PATCH") {
      try {
        const parsed = patientStatusPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid patient status payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const patient = await updatePatientReviewStatus(env, patientId, parsed.data.review_status);
        return jsonWithCors({ patient });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to update patient status." }, { status: 500 });
      }
    }

    if (request.method === "DELETE") {
      try {
        const deleted = await deletePatient(env, patientId);
        if (!deleted) {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ ok: true });
      } catch {
        return jsonWithCors({ error: "Unable to delete patient." }, { status: 500 });
      }
    }
  }

  if (suffix === "/medical") {
    if (request.method === "GET") {
      const medicalHistory = await getMedicalHistory(env, patientId);
      return jsonWithCors({ medicalHistory });
    }

    if (request.method === "PUT") {
      try {
        const parsed = medicalHistoryPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid medical history payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const medicalHistory = await upsertMedicalHistory(env, patientId, parsed.data);
        return jsonWithCors({ medicalHistory });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to save medical history." }, { status: 500 });
      }
    }
  }

  if (suffix === "/dental") {
    if (request.method === "GET") {
      const dentalHistory = await getDentalHistory(env, patientId);
      return jsonWithCors({ dentalHistory });
    }

    if (request.method === "PUT") {
      try {
        const parsed = dentalHistoryPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid dental history payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const dentalHistory = await upsertDentalHistory(env, patientId, parsed.data);
        return jsonWithCors({ dentalHistory });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to save dental history." }, { status: 500 });
      }
    }
  }

  if (suffix === "/intraoral") {
    if (request.method === "GET") {
      const intraoralExam = await getLatestIntraoralExam(env, patientId);
      return jsonWithCors({ intraoralExam });
    }

    if (request.method === "PUT") {
      try {
        const parsed = intraoralPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid intraoral payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const intraoralExam = await upsertIntraoralExam(env, patientId, parsed.data);
        return jsonWithCors({ intraoralExam });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to save intraoral exam." }, { status: 500 });
      }
    }
  }

  if (suffix === "/plan") {
    if (request.method === "GET") {
      try {
        const plans = await listTreatmentPlans(env, patientId);
        return jsonWithCors({ plans });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to fetch treatment plans." }, { status: 500 });
      }
    }

    if (request.method === "POST") {
      try {
        const parsed = treatmentPlanPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid treatment plan payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const plan = await createTreatmentPlan(env, patientId, parsed.data);
        return jsonWithCors({ plan }, { status: 201 });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to create treatment plan." }, { status: 500 });
      }
    }

    if (request.method === "PATCH") {
      const url = new URL(request.url);
      const planId = url.searchParams.get("planId");
      if (!planId) {
        return jsonWithCors({ error: "Missing planId query parameter." }, { status: 400 });
      }

      try {
        const parsed = treatmentPlanPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid treatment plan payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const updated = await updateTreatmentPlan(env, patientId, planId, parsed.data);
        if (!updated) {
          return jsonWithCors({ error: "Treatment plan not found." }, { status: 404 });
        }

        return jsonWithCors({ plan: updated });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to update plan status." }, { status: 500 });
      }
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const planId = url.searchParams.get("planId");
      if (!planId) {
        return jsonWithCors({ error: "Missing planId query parameter." }, { status: 400 });
      }

      try {
        const deleted = await deleteTreatmentPlan(env, patientId, planId);
        if (!deleted) {
          return jsonWithCors({ error: "Treatment plan not found." }, { status: 404 });
        }

        return jsonWithCors({ ok: true });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to delete treatment plan." }, { status: 500 });
      }
    }
  }

  if (suffix === "/records") {
    if (request.method === "GET") {
      try {
        const records = await listTreatmentRecords(env, patientId);
        return jsonWithCors({ records });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to fetch treatment records." }, { status: 500 });
      }
    }

    if (request.method === "POST") {
      try {
        const parsed = treatmentRecordPayloadSchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonWithCors(
            { error: "Invalid treatment record payload.", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const record = await createTreatmentRecord(env, patientId, parsed.data);
        return jsonWithCors({ record }, { status: 201 });
      } catch (error) {
        if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
          return jsonWithCors({ error: "Patient not found." }, { status: 404 });
        }

        return jsonWithCors({ error: "Unable to create treatment record." }, { status: 500 });
      }
    }
  }

  return notFound("Route not implemented yet in Worker backend.");
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    await ensureSeedData(env);

    if (request.method === "OPTIONS") {
      return jsonWithCors({ ok: true }, { status: 204 });
    }

    if (url.pathname === "/") {
      return jsonWithCors({ ok: true, service: "patientapp-backend" });
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return handleAuthLogin(request, env);
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleAuthLogout(request);
    }

    if (url.pathname.startsWith("/api/settings")) {
      return routeSettings(request, env, url.pathname);
    }

    if (url.pathname.startsWith("/api/patients")) {
      return routePatients(request, env, url.pathname);
    }

    return notFound("Route not implemented yet in Worker backend.");
  },
};
