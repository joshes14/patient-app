import { backendJson, backendJsonOrNull, isBackendProxyMode } from "@/lib/backend-client";
import type {
  AppSettings,
  DentalHistory,
  IntraoralExamination,
  MedicalHistory,
  Patient,
  PatientBundle,
  PatientReviewStatus,
  Practitioner,
  TreatmentPlan,
  TreatmentRecord,
} from "@/lib/types";
import type {
  AppSettingsPayload,
  DentalHistoryPayload,
  IntraoralPayload,
  MedicalHistoryPayload,
  PatientPayload,
  PractitionerPayload,
  TreatmentPlanPayload,
  TreatmentRecordPayload,
} from "@/lib/validators";

type LocalRepository = typeof import("@/lib/server/local-repository");

const loadLocalRepository = async (): Promise<LocalRepository> => {
  return import("@/lib/server/local-repository");
};

const withLocal = async <T>(callback: (repository: LocalRepository) => T | Promise<T>): Promise<T> => {
  const repository = await loadLocalRepository();
  return callback(repository);
};

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export async function getAppSettings(): Promise<AppSettings> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetAppSettings());
  }

  const payload = await backendJson<{ settings: AppSettings }>("/api/settings");
  return payload.settings;
}

export async function updateAppSettings(payload: AppSettingsPayload): Promise<AppSettings> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpdateAppSettings(payload));
  }

  const response = await backendJson<{ settings: AppSettings }>("/api/settings", jsonInit("PUT", payload));
  return response.settings;
}

export async function listPractitioners(): Promise<Practitioner[]> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localListPractitioners());
  }

  const payload = await backendJson<{ practitioners: Practitioner[] }>("/api/settings/practitioners");
  return payload.practitioners;
}

export async function createPractitioner(payload: PractitionerPayload): Promise<Practitioner> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localCreatePractitioner(payload));
  }

  const response = await backendJson<{ practitioner: Practitioner }>(
    "/api/settings/practitioners",
    jsonInit("POST", payload),
  );
  return response.practitioner;
}

export async function updatePractitionerPassword(
  practitionerId: string,
  password: string,
): Promise<Practitioner | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpdatePractitionerPassword(practitionerId, password));
  }

  const response = await backendJsonOrNull<{ practitioner: Practitioner }>(
    `/api/settings/practitioners/${encodeURIComponent(practitionerId)}`,
    jsonInit("PATCH", { password }),
  );

  return response?.practitioner ?? null;
}

export async function deactivatePractitioner(practitionerId: string): Promise<Practitioner | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localDeactivatePractitioner(practitionerId));
  }

  const response = await backendJsonOrNull<{ practitioner: Practitioner }>(
    `/api/settings/practitioners/${encodeURIComponent(practitionerId)}`,
    jsonInit("DELETE"),
  );

  return response?.practitioner ?? null;
}

export async function listPatients(params?: {
  q?: string;
  sex?: string;
  review_status?: PatientReviewStatus | "all";
}): Promise<Patient[]> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localListPatients(params));
  }

  const searchParams = new URLSearchParams();
  if (params?.q) {
    searchParams.set("q", params.q);
  }
  if (params?.sex) {
    searchParams.set("sex", params.sex);
  }
  if (params?.review_status) {
    searchParams.set("review_status", params.review_status);
  }

  const query = searchParams.toString();
  const payload = await backendJson<{ patients: Patient[] }>(
    `/api/patients${query.length > 0 ? `?${query}` : ""}`,
  );
  return payload.patients;
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetPatientById(patientId));
  }

  const bundle = await backendJsonOrNull<PatientBundle>(`/api/patients/${encodeURIComponent(patientId)}`);
  return bundle?.patient ?? null;
}

export async function createPatient(payload: PatientPayload): Promise<Patient> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localCreatePatient(payload));
  }

  const response = await backendJson<{ patient: Patient }>("/api/patients", jsonInit("POST", payload));
  return response.patient;
}

export async function updatePatient(patientId: string, payload: PatientPayload): Promise<Patient> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpdatePatient(patientId, payload));
  }

  const response = await backendJson<{ patient: Patient }>(
    `/api/patients/${encodeURIComponent(patientId)}`,
    jsonInit("PUT", payload),
  );
  return response.patient;
}

export async function updatePatientReviewStatus(
  patientId: string,
  reviewStatus: PatientReviewStatus,
): Promise<Patient> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpdatePatientReviewStatus(patientId, reviewStatus));
  }

  const response = await backendJson<{ patient: Patient }>(
    `/api/patients/${encodeURIComponent(patientId)}`,
    jsonInit("PATCH", { review_status: reviewStatus }),
  );
  return response.patient;
}

export async function deletePatient(patientId: string): Promise<boolean> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localDeletePatient(patientId));
  }

  const response = await backendJson<{ ok: boolean }>(
    `/api/patients/${encodeURIComponent(patientId)}`,
    jsonInit("DELETE"),
  );
  return Boolean(response.ok);
}

export async function getMedicalHistory(patientId: string): Promise<MedicalHistory | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetMedicalHistory(patientId));
  }

  const response = await backendJsonOrNull<{ medicalHistory: MedicalHistory | null }>(
    `/api/patients/${encodeURIComponent(patientId)}/medical`,
  );
  return response?.medicalHistory ?? null;
}

export async function upsertMedicalHistory(
  patientId: string,
  payload: MedicalHistoryPayload,
): Promise<MedicalHistory> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpsertMedicalHistory(patientId, payload));
  }

  const response = await backendJson<{ medicalHistory: MedicalHistory }>(
    `/api/patients/${encodeURIComponent(patientId)}/medical`,
    jsonInit("PUT", payload),
  );
  return response.medicalHistory;
}

export async function getDentalHistory(patientId: string): Promise<DentalHistory | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetDentalHistory(patientId));
  }

  const response = await backendJsonOrNull<{ dentalHistory: DentalHistory | null }>(
    `/api/patients/${encodeURIComponent(patientId)}/dental`,
  );
  return response?.dentalHistory ?? null;
}

export async function upsertDentalHistory(
  patientId: string,
  payload: DentalHistoryPayload,
): Promise<DentalHistory> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpsertDentalHistory(patientId, payload));
  }

  const response = await backendJson<{ dentalHistory: DentalHistory }>(
    `/api/patients/${encodeURIComponent(patientId)}/dental`,
    jsonInit("PUT", payload),
  );
  return response.dentalHistory;
}

export async function getLatestIntraoralExam(patientId: string): Promise<IntraoralExamination | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetLatestIntraoralExam(patientId));
  }

  const response = await backendJsonOrNull<{ intraoralExam: IntraoralExamination | null }>(
    `/api/patients/${encodeURIComponent(patientId)}/intraoral`,
  );
  return response?.intraoralExam ?? null;
}

export async function upsertIntraoralExam(
  patientId: string,
  payload: IntraoralPayload,
): Promise<IntraoralExamination> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpsertIntraoralExam(patientId, payload));
  }

  const response = await backendJson<{ intraoralExam: IntraoralExamination }>(
    `/api/patients/${encodeURIComponent(patientId)}/intraoral`,
    jsonInit("PUT", payload),
  );
  return response.intraoralExam;
}

export async function listTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localListTreatmentPlans(patientId));
  }

  const response = await backendJsonOrNull<{ plans: TreatmentPlan[] }>(
    `/api/patients/${encodeURIComponent(patientId)}/plan`,
  );
  return response?.plans ?? [];
}

export async function createTreatmentPlan(
  patientId: string,
  payload: TreatmentPlanPayload,
): Promise<TreatmentPlan> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localCreateTreatmentPlan(patientId, payload));
  }

  const response = await backendJson<{ plan: TreatmentPlan }>(
    `/api/patients/${encodeURIComponent(patientId)}/plan`,
    jsonInit("POST", payload),
  );
  return response.plan;
}

export async function updateTreatmentPlan(
  patientId: string,
  planId: string,
  payload: TreatmentPlanPayload,
): Promise<TreatmentPlan | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localUpdateTreatmentPlan(patientId, planId, payload));
  }

  const response = await backendJsonOrNull<{ plan: TreatmentPlan }>(
    `/api/patients/${encodeURIComponent(patientId)}/plan?planId=${encodeURIComponent(planId)}`,
    jsonInit("PATCH", payload),
  );
  return response?.plan ?? null;
}

export async function listTreatmentRecords(patientId: string): Promise<TreatmentRecord[]> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localListTreatmentRecords(patientId));
  }

  const response = await backendJsonOrNull<{ records: TreatmentRecord[] }>(
    `/api/patients/${encodeURIComponent(patientId)}/records`,
  );
  return response?.records ?? [];
}

export async function createTreatmentRecord(
  patientId: string,
  payload: TreatmentRecordPayload,
): Promise<TreatmentRecord> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localCreateTreatmentRecord(patientId, payload));
  }

  const response = await backendJson<{ record: TreatmentRecord }>(
    `/api/patients/${encodeURIComponent(patientId)}/records`,
    jsonInit("POST", payload),
  );
  return response.record;
}

export async function getPatientBundle(patientId: string): Promise<PatientBundle | null> {
  if (!isBackendProxyMode()) {
    return withLocal((repository) => repository.localGetPatientBundle(patientId));
  }

  return backendJsonOrNull<PatientBundle>(`/api/patients/${encodeURIComponent(patientId)}`);
}
