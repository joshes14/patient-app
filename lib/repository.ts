import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { generatePatientId } from "@/lib/patient-id";
import { DEFAULT_APP_SETTINGS } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import type {
  AppSettings,
  DentalHistory,
  IntraoralExamination,
  MedicalHistory,
  Patient,
  PatientBundle,
  Practitioner,
  TreatmentPlan,
  TreatmentRecord,
  PatientReviewStatus,
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

const nullableText = (value?: string | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nullableNumber = (value?: number | null): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
};

const boolToInt = (value?: boolean): number => (value ? 1 : 0);

const normalizeReviewStatus = (value?: string | null): PatientReviewStatus => {
  if (value === "archived") {
    return value;
  }

  return "active";
};

const ensurePatientExists = (patientId: string): void => {
  const exists = db
    .prepare("SELECT id FROM patients WHERE id = ?")
    .get(patientId) as { id: string } | undefined;

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }
};

const touchPatientUpdatedAt = (patientId: string): void => {
  db.prepare(
    `
    UPDATE patients
    SET updated_at = datetime('now')
    WHERE id = ?
    `,
  ).run(patientId);
};

export const getAppSettings = (): AppSettings => {
  let row: AppSettings | undefined;

  try {
    row = db
      .prepare(
        `
        SELECT
          shell_title,
          shell_subtitle,
          clinic_name,
          add_patient_label,
          dashboard_title,
          dashboard_ledger_title,
          dashboard_description,
          updated_at
        FROM app_settings
        WHERE id = 1
        LIMIT 1
        `,
      )
      .get() as AppSettings | undefined;
  } catch {
    row = undefined;
  }

  if (row) {
    return row;
  }

  const legacyRow = db
    .prepare(
      `
      SELECT
        shell_title,
        shell_subtitle,
        clinic_name,
        add_patient_label,
        dashboard_title,
        dashboard_description,
        updated_at
      FROM app_settings
      WHERE id = 1
      LIMIT 1
      `,
    )
    .get() as Omit<AppSettings, "dashboard_ledger_title"> | undefined;

  if (legacyRow) {
    return {
      ...legacyRow,
      dashboard_ledger_title: DEFAULT_APP_SETTINGS.dashboard_ledger_title,
    };
  }

  return {
    ...DEFAULT_APP_SETTINGS,
    updated_at: new Date().toISOString(),
  };
};

export const updateAppSettings = (payload: AppSettingsPayload): AppSettings => {
  db.prepare(
    `
    INSERT INTO app_settings (
      id,
      shell_title,
      shell_subtitle,
      clinic_name,
      add_patient_label,
      dashboard_title,
      dashboard_ledger_title,
      dashboard_description,
      updated_at
    )
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      shell_title = excluded.shell_title,
      shell_subtitle = excluded.shell_subtitle,
      clinic_name = excluded.clinic_name,
      add_patient_label = excluded.add_patient_label,
      dashboard_title = excluded.dashboard_title,
      dashboard_ledger_title = excluded.dashboard_ledger_title,
      dashboard_description = excluded.dashboard_description,
      updated_at = datetime('now')
    `,
  ).run(
    payload.shell_title.trim(),
    payload.shell_subtitle.trim(),
    payload.clinic_name.trim(),
    payload.add_patient_label.trim(),
    payload.dashboard_title.trim(),
    payload.dashboard_ledger_title.trim(),
    payload.dashboard_description.trim(),
  );

  return getAppSettings();
};

export const listPractitioners = (): Practitioner[] => {
  return db
    .prepare(
      `
      SELECT id, display_name, is_active, created_at, updated_at
      FROM practitioners
      ORDER BY is_active DESC, datetime(created_at) ASC
      `,
    )
    .all() as Practitioner[];
};

export const createPractitioner = (payload: PractitionerPayload): Practitioner => {
  const id = payload.id.trim();
  const displayName = payload.display_name.trim();
  const hashedPassword = hashPassword(payload.password);

  db.prepare(
    `
    INSERT INTO practitioners (id, display_name, password, is_active)
    VALUES (?, ?, ?, 1)
    `,
  ).run(id, displayName, hashedPassword);

  return db
    .prepare(
      `
      SELECT id, display_name, is_active, created_at, updated_at
      FROM practitioners
      WHERE id = ?
      LIMIT 1
      `,
    )
    .get(id) as Practitioner;
};

export const updatePractitionerPassword = (
  practitionerId: string,
  password: string,
): Practitioner | null => {
  const result = db
    .prepare(
      `
      UPDATE practitioners
      SET password = ?, updated_at = datetime('now')
      WHERE id = ?
      `,
    )
    .run(hashPassword(password), practitionerId);

  if (result.changes === 0) {
    return null;
  }

  return db
    .prepare(
      `
      SELECT id, display_name, is_active, created_at, updated_at
      FROM practitioners
      WHERE id = ?
      LIMIT 1
      `,
    )
    .get(practitionerId) as Practitioner;
};

export const deactivatePractitioner = (practitionerId: string): Practitioner | null => {
  const row = db
    .prepare(
      `
      SELECT id, is_active
      FROM practitioners
      WHERE id = ?
      LIMIT 1
      `,
    )
    .get(practitionerId) as { id: string; is_active: number } | undefined;

  if (!row) {
    return null;
  }

  if (row.is_active === 0) {
    return db
      .prepare(
        `
        SELECT id, display_name, is_active, created_at, updated_at
        FROM practitioners
        WHERE id = ?
        LIMIT 1
        `,
      )
      .get(practitionerId) as Practitioner;
  }

  const activeCount = db
    .prepare(
      `
      SELECT COUNT(*) AS total
      FROM practitioners
      WHERE is_active = 1
      `,
    )
    .get() as { total: number };

  if (activeCount.total <= 1) {
    throw new Error("LAST_ACTIVE_PRACTITIONER");
  }

  db.prepare(
    `
    UPDATE practitioners
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
    `,
  ).run(practitionerId);

  return db
    .prepare(
      `
      SELECT id, display_name, is_active, created_at, updated_at
      FROM practitioners
      WHERE id = ?
      LIMIT 1
      `,
    )
    .get(practitionerId) as Practitioner;
};

export const listPatients = (params?: {
  q?: string;
  sex?: string;
  review_status?: PatientReviewStatus | "all";
}): Patient[] => {
  const query = params?.q?.trim() ?? "";
  const sex = params?.sex?.trim() ?? "";
  const reviewStatus = params?.review_status ?? "all";

  let sql = `
    SELECT id, last_name, first_name, middle_name, date_of_birth, age, sex,
           civil_status, religion, occupation, nationality, height, weight,
           home_address, home_telephone, cellphone, medical_alert,
           emergency_contact_name, emergency_contact_telephone, emergency_contact_address,
           relationship_to_patient, chief_complaint, history_of_present_illness,
           review_status,
           created_at, updated_at
    FROM patients
    WHERE 1=1
  `;
  const binds: unknown[] = [];

  if (query.length > 0) {
    const like = `%${query}%`;
    sql += " AND (id LIKE ? OR last_name LIKE ? OR first_name LIKE ? OR middle_name LIKE ?)";
    binds.push(like, like, like, like);
  }

  if (sex.length > 0) {
    sql += " AND sex = ?";
    binds.push(sex);
  }

  if (reviewStatus !== "all") {
    sql += " AND review_status = ?";
    binds.push(reviewStatus);
  }

  sql += " ORDER BY datetime(created_at) DESC";

  return db.prepare(sql).all(...binds) as Patient[];
};

export const getPatientById = (patientId: string): Patient | null => {
  const row = db
    .prepare(
      `
      SELECT id, last_name, first_name, middle_name, date_of_birth, age, sex,
             civil_status, religion, occupation, nationality, height, weight,
             home_address, home_telephone, cellphone, medical_alert,
             emergency_contact_name, emergency_contact_telephone, emergency_contact_address,
             relationship_to_patient, chief_complaint, history_of_present_illness,
             review_status,
             created_at, updated_at
      FROM patients
      WHERE id = ?
      `,
    )
    .get(patientId) as Patient | undefined;

  return row ?? null;
};

export const createPatient = (payload: PatientPayload): Patient => {
  const id = generatePatientId();

  db.prepare(
    `
    INSERT INTO patients (
      id,
      medical_alert,
      last_name,
      first_name,
      middle_name,
      date_of_birth,
      age,
      sex,
      civil_status,
      religion,
      occupation,
      nationality,
      height,
      weight,
      home_address,
      home_telephone,
      cellphone,
      emergency_contact_name,
      emergency_contact_telephone,
      emergency_contact_address,
      relationship_to_patient,
      chief_complaint,
      history_of_present_illness,
      review_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    nullableText(payload.medical_alert),
    payload.last_name.trim(),
    payload.first_name.trim(),
    nullableText(payload.middle_name),
    nullableText(payload.date_of_birth),
    nullableNumber(payload.age as unknown as number | null),
    nullableText(payload.sex),
    nullableText(payload.civil_status),
    nullableText(payload.religion),
    nullableText(payload.occupation),
    nullableText(payload.nationality),
    nullableText(payload.height),
    nullableText(payload.weight),
    nullableText(payload.home_address),
    nullableText(payload.home_telephone),
    nullableText(payload.cellphone),
    nullableText(payload.emergency_contact_name),
    nullableText(payload.emergency_contact_telephone),
    nullableText(payload.emergency_contact_address),
    nullableText(payload.relationship_to_patient),
    nullableText(payload.chief_complaint),
    nullableText(payload.history_of_present_illness),
    normalizeReviewStatus(payload.review_status),
  );

  return getPatientById(id)!;
};

export const updatePatient = (patientId: string, payload: PatientPayload): Patient => {
  ensurePatientExists(patientId);

  db.prepare(
    `
    UPDATE patients
    SET
      last_name = ?,
      first_name = ?,
      middle_name = ?,
      date_of_birth = ?,
      sex = ?,
      age = ?,
      civil_status = ?,
      religion = ?,
      occupation = ?,
      nationality = ?,
      height = ?,
      weight = ?,
      home_address = ?,
      home_telephone = ?,
      cellphone = ?,
      medical_alert = ?,
      emergency_contact_name = ?,
      emergency_contact_telephone = ?,
      emergency_contact_address = ?,
      relationship_to_patient = ?,
      chief_complaint = ?,
      history_of_present_illness = ?,
      review_status = ?,
      updated_at = datetime('now')
    WHERE id = ?
    `,
  ).run(
    payload.last_name.trim(),
    payload.first_name.trim(),
    nullableText(payload.middle_name),
    nullableText(payload.date_of_birth),
    nullableText(payload.sex),
    nullableNumber(payload.age as unknown as number | null),
    nullableText(payload.civil_status),
    nullableText(payload.religion),
    nullableText(payload.occupation),
    nullableText(payload.nationality),
    nullableText(payload.height),
    nullableText(payload.weight),
    nullableText(payload.home_address),
    nullableText(payload.home_telephone),
    nullableText(payload.cellphone),
    nullableText(payload.medical_alert),
    nullableText(payload.emergency_contact_name),
    nullableText(payload.emergency_contact_telephone),
    nullableText(payload.emergency_contact_address),
    nullableText(payload.relationship_to_patient),
    nullableText(payload.chief_complaint),
    nullableText(payload.history_of_present_illness),
    normalizeReviewStatus(payload.review_status),
    patientId,
  );

  return getPatientById(patientId)!;
};

export const updatePatientReviewStatus = (
  patientId: string,
  reviewStatus: PatientReviewStatus,
): Patient => {
  ensurePatientExists(patientId);

  db.prepare(
    `
    UPDATE patients
    SET review_status = ?, updated_at = datetime('now')
    WHERE id = ?
    `,
  ).run(normalizeReviewStatus(reviewStatus), patientId);

  return getPatientById(patientId)!;
};

export const deletePatient = (patientId: string): boolean => {
  const result = db
    .prepare(
      `
      DELETE FROM patients
      WHERE id = ?
      `,
    )
    .run(patientId);

  return result.changes > 0;
};

export const getMedicalHistory = (patientId: string): MedicalHistory | null => {
  const row = db
    .prepare(
      `
      SELECT id, patient_id,
             physician_name, physician_office_number, physician_office_address,

             in_good_health, under_medical_treatment, condition_being_treated,
             hospitalized, hospitalization_reason, taking_medication, medication_details,
             uses_tobacco, uses_drugs, drug_details,

             allergic_local_anesthetic, allergic_penicillin, allergic_aspirin,
             allergic_latex, allergic_others,

             is_pregnant, is_nursing, taking_birth_control,

             blood_type, blood_pressure, pulse_rate, respiratory_rate,
             body_temperature, height, weight_vitals,

             has_high_blood_pressure, has_low_blood_pressure, has_epilepsy,
             has_aids_hiv, has_std, has_stomach_troubles, has_fainting_seizures,
             has_rapid_weight_loss, has_radiation_therapy, has_joint_replacement,
             has_diabetes, has_heart_surgery, has_heart_disease, has_heart_murmur,
             has_hepatitis_liver, has_rheumatic_fever, has_hay_fever,
             has_respiratory_problems, has_hepatitis_jaundice, has_tuberculosis,
             has_swollen_ankles, has_kidney_disease, has_chest_pain, has_heart_attack,
             has_cancer_tumors, has_anemia, has_angina, has_asthma, has_emphysema,
             has_bleeding_problems, has_blood_diseases, has_head_injuries,
             has_arthritis, has_thyroid_problem, has_stroke, has_others,

             updated_at
      FROM medical_history
      WHERE patient_id = ?
      LIMIT 1
      `,
    )
    .get(patientId) as MedicalHistory | undefined;

  return row ?? null;
};

export const upsertMedicalHistory = (
  patientId: string,
  payload: MedicalHistoryPayload,
): MedicalHistory => {
  ensurePatientExists(patientId);

  const existing = getMedicalHistory(patientId);

  if (existing) {
    db.prepare(
      `
      UPDATE medical_history
      SET
        physician_name = ?, physician_office_number = ?, physician_office_address = ?,

        in_good_health = ?, under_medical_treatment = ?, condition_being_treated = ?,
        hospitalized = ?, hospitalization_reason = ?, taking_medication = ?, medication_details = ?,
        uses_tobacco = ?, uses_drugs = ?, drug_details = ?,

        allergic_local_anesthetic = ?, allergic_penicillin = ?, allergic_aspirin = ?, allergic_latex = ?, allergic_others = ?,

        is_pregnant = ?, is_nursing = ?, taking_birth_control = ?,

        blood_type = ?, blood_pressure = ?, pulse_rate = ?, respiratory_rate = ?, body_temperature = ?, height = ?, weight_vitals = ?,

        has_high_blood_pressure = ?, has_low_blood_pressure = ?, has_epilepsy = ?, has_aids_hiv = ?, has_std = ?, has_stomach_troubles = ?,
        has_fainting_seizures = ?, has_rapid_weight_loss = ?, has_radiation_therapy = ?, has_joint_replacement = ?,
        has_diabetes = ?, has_heart_surgery = ?, has_heart_disease = ?, has_heart_murmur = ?, has_hepatitis_liver = ?,
        has_rheumatic_fever = ?, has_hay_fever = ?, has_respiratory_problems = ?, has_hepatitis_jaundice = ?, has_tuberculosis = ?,
        has_swollen_ankles = ?, has_kidney_disease = ?, has_chest_pain = ?, has_heart_attack = ?, has_cancer_tumors = ?,
        has_anemia = ?, has_angina = ?, has_asthma = ?, has_emphysema = ?, has_bleeding_problems = ?, has_blood_diseases = ?,
        has_head_injuries = ?, has_arthritis = ?, has_thyroid_problem = ?, has_stroke = ?, has_others = ?,

        updated_at = datetime('now')
      WHERE id = ?
      `,
    ).run(
      nullableText(payload.physician_name),
      nullableText(payload.physician_office_number),
      nullableText(payload.physician_office_address),

      boolToInt(payload.in_good_health),
      boolToInt(payload.under_medical_treatment),
      nullableText(payload.condition_being_treated),
      boolToInt(payload.hospitalized),
      nullableText(payload.hospitalization_reason),
      boolToInt(payload.taking_medication),
      nullableText(payload.medication_details),
      boolToInt(payload.uses_tobacco),
      boolToInt(payload.uses_drugs),
      nullableText(payload.drug_details),

      boolToInt(payload.allergic_local_anesthetic),
      boolToInt(payload.allergic_penicillin),
      boolToInt(payload.allergic_aspirin),
      boolToInt(payload.allergic_latex),
      nullableText(payload.allergic_others),

      boolToInt(payload.is_pregnant),
      boolToInt(payload.is_nursing),
      boolToInt(payload.taking_birth_control),

      nullableText(payload.blood_type),
      nullableText(payload.blood_pressure),
      nullableText(payload.pulse_rate),
      nullableText(payload.respiratory_rate),
      nullableText(payload.body_temperature),
      nullableText(payload.height),
      nullableText(payload.weight_vitals),

      boolToInt(payload.has_high_blood_pressure),
      boolToInt(payload.has_low_blood_pressure),
      boolToInt(payload.has_epilepsy),
      boolToInt(payload.has_aids_hiv),
      boolToInt(payload.has_std),
      boolToInt(payload.has_stomach_troubles),
      boolToInt(payload.has_fainting_seizures),
      boolToInt(payload.has_rapid_weight_loss),
      boolToInt(payload.has_radiation_therapy),
      boolToInt(payload.has_joint_replacement),
      boolToInt(payload.has_diabetes),
      boolToInt(payload.has_heart_surgery),
      boolToInt(payload.has_heart_disease),
      boolToInt(payload.has_heart_murmur),
      boolToInt(payload.has_hepatitis_liver),
      boolToInt(payload.has_rheumatic_fever),
      boolToInt(payload.has_hay_fever),
      boolToInt(payload.has_respiratory_problems),
      boolToInt(payload.has_hepatitis_jaundice),
      boolToInt(payload.has_tuberculosis),
      boolToInt(payload.has_swollen_ankles),
      boolToInt(payload.has_kidney_disease),
      boolToInt(payload.has_chest_pain),
      boolToInt(payload.has_heart_attack),
      boolToInt(payload.has_cancer_tumors),
      boolToInt(payload.has_anemia),
      boolToInt(payload.has_angina),
      boolToInt(payload.has_asthma),
      boolToInt(payload.has_emphysema),
      boolToInt(payload.has_bleeding_problems),
      boolToInt(payload.has_blood_diseases),
      boolToInt(payload.has_head_injuries),
      boolToInt(payload.has_arthritis),
      boolToInt(payload.has_thyroid_problem),
      boolToInt(payload.has_stroke),
      nullableText(payload.has_others),

      existing.id,
    );
  } else {
    // Build columns and values arrays dynamically to ensure placeholders
    // always match the number of provided values. This prevents "N values
    // for M columns" SQLite errors when the DB schema differs slightly.
    const columns = [
      "id",
      "patient_id",
      "physician_name",
      "physician_office_number",
      "physician_office_address",

      "in_good_health",
      "under_medical_treatment",
      "condition_being_treated",
      "hospitalized",
      "hospitalization_reason",
      "taking_medication",
      "medication_details",
      "uses_tobacco",
      "uses_drugs",
      "drug_details",

      "allergic_local_anesthetic",
      "allergic_penicillin",
      "allergic_aspirin",
      "allergic_latex",
      "allergic_others",

      "is_pregnant",
      "is_nursing",
      "taking_birth_control",

      "blood_type",
      "blood_pressure",
      "pulse_rate",
      "respiratory_rate",
      "body_temperature",
      "height",
      "weight_vitals",

      "has_high_blood_pressure",
      "has_low_blood_pressure",
      "has_epilepsy",
      "has_aids_hiv",
      "has_std",
      "has_stomach_troubles",
      "has_fainting_seizures",
      "has_rapid_weight_loss",
      "has_radiation_therapy",
      "has_joint_replacement",
      "has_diabetes",
      "has_heart_surgery",
      "has_heart_disease",
      "has_heart_murmur",
      "has_hepatitis_liver",
      "has_rheumatic_fever",
      "has_hay_fever",
      "has_respiratory_problems",
      "has_hepatitis_jaundice",
      "has_tuberculosis",
      "has_swollen_ankles",
      "has_kidney_disease",
      "has_chest_pain",
      "has_heart_attack",
      "has_cancer_tumors",
      "has_anemia",
      "has_angina",
      "has_asthma",
      "has_emphysema",
      "has_bleeding_problems",
      "has_blood_diseases",
      "has_head_injuries",
      "has_arthritis",
      "has_thyroid_problem",
      "has_stroke",
      "has_others",
    ];

    const values: unknown[] = [
      uuidv4(),
      patientId,
      nullableText(payload.physician_name),
      nullableText(payload.physician_office_number),
      nullableText(payload.physician_office_address),

      boolToInt(payload.in_good_health),
      boolToInt(payload.under_medical_treatment),
      nullableText(payload.condition_being_treated),
      boolToInt(payload.hospitalized),
      nullableText(payload.hospitalization_reason),
      boolToInt(payload.taking_medication),
      nullableText(payload.medication_details),
      boolToInt(payload.uses_tobacco),
      boolToInt(payload.uses_drugs),
      nullableText(payload.drug_details),

      boolToInt(payload.allergic_local_anesthetic),
      boolToInt(payload.allergic_penicillin),
      boolToInt(payload.allergic_aspirin),
      boolToInt(payload.allergic_latex),
      nullableText(payload.allergic_others),

      boolToInt(payload.is_pregnant),
      boolToInt(payload.is_nursing),
      boolToInt(payload.taking_birth_control),

      nullableText(payload.blood_type),
      nullableText(payload.blood_pressure),
      nullableText(payload.pulse_rate),
      nullableText(payload.respiratory_rate),
      nullableText(payload.body_temperature),
      nullableText(payload.height),
      nullableText(payload.weight_vitals),

      boolToInt(payload.has_high_blood_pressure),
      boolToInt(payload.has_low_blood_pressure),
      boolToInt(payload.has_epilepsy),
      boolToInt(payload.has_aids_hiv),
      boolToInt(payload.has_std),
      boolToInt(payload.has_stomach_troubles),
      boolToInt(payload.has_fainting_seizures),
      boolToInt(payload.has_rapid_weight_loss),
      boolToInt(payload.has_radiation_therapy),
      boolToInt(payload.has_joint_replacement),
      boolToInt(payload.has_diabetes),
      boolToInt(payload.has_heart_surgery),
      boolToInt(payload.has_heart_disease),
      boolToInt(payload.has_heart_murmur),
      boolToInt(payload.has_hepatitis_liver),
      boolToInt(payload.has_rheumatic_fever),
      boolToInt(payload.has_hay_fever),
      boolToInt(payload.has_respiratory_problems),
      boolToInt(payload.has_hepatitis_jaundice),
      boolToInt(payload.has_tuberculosis),
      boolToInt(payload.has_swollen_ankles),
      boolToInt(payload.has_kidney_disease),
      boolToInt(payload.has_chest_pain),
      boolToInt(payload.has_heart_attack),
      boolToInt(payload.has_cancer_tumors),
      boolToInt(payload.has_anemia),
      boolToInt(payload.has_angina),
      boolToInt(payload.has_asthma),
      boolToInt(payload.has_emphysema),
      boolToInt(payload.has_bleeding_problems),
      boolToInt(payload.has_blood_diseases),
      boolToInt(payload.has_head_injuries),
      boolToInt(payload.has_arthritis),
      boolToInt(payload.has_thyroid_problem),
      boolToInt(payload.has_stroke),
      nullableText(payload.has_others),
    ];

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO medical_history (${columns.join(", ")}) VALUES (${placeholders})`;
    db.prepare(sql).run(...values);
  }

  touchPatientUpdatedAt(patientId);

  return getMedicalHistory(patientId)!;
};

export const getDentalHistory = (patientId: string): DentalHistory | null => {
  const row = db
    .prepare(
      `
      SELECT id, patient_id, frequency_of_dental_visit,
             date_of_last_dental_visit, procedures_done_on_last_visit,
             exposure_to_local_anesthesia, complications_during_after_procedure, updated_at
      FROM dental_history
      WHERE patient_id = ?
      LIMIT 1
      `,
    )
    .get(patientId) as DentalHistory | undefined;

  return row ?? null;
};

export const upsertDentalHistory = (
  patientId: string,
  payload: DentalHistoryPayload,
): DentalHistory => {
  ensurePatientExists(patientId);

  const existing = getDentalHistory(patientId);

  if (existing) {
    db.prepare(
      `
      UPDATE dental_history
      SET
        frequency_of_dental_visit = ?,
        date_of_last_dental_visit = ?,
        procedures_done_on_last_visit = ?,
        exposure_to_local_anesthesia = ?,
        complications_during_after_procedure = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
    ).run(
      nullableText(payload.frequency_of_dental_visit),
      nullableText(payload.date_of_last_dental_visit),
      nullableText(payload.procedures_done_on_last_visit),
      nullableText(payload.exposure_to_local_anesthesia),
      nullableText(payload.complications_during_after_procedure),
      existing.id,
    );
  } else {
    db.prepare(
      `
      INSERT INTO dental_history (
        id, patient_id, frequency_of_dental_visit, date_of_last_dental_visit,
        procedures_done_on_last_visit, exposure_to_local_anesthesia, complications_during_after_procedure
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      uuidv4(),
      patientId,
      nullableText(payload.frequency_of_dental_visit),
      nullableText(payload.date_of_last_dental_visit),
      nullableText(payload.procedures_done_on_last_visit),
      nullableText(payload.exposure_to_local_anesthesia),
      nullableText(payload.complications_during_after_procedure),
    );
  }

  touchPatientUpdatedAt(patientId);

  return getDentalHistory(patientId)!;
};

export const getLatestIntraoralExam = (patientId: string): IntraoralExamination | null => {
  const row = db
    .prepare(
      `
      SELECT id, patient_id, examined_at, soft_tissues, periodontium,
             occlusion, oral_hygiene_status, tooth_chart, notes
      FROM intraoral_examination
      WHERE patient_id = ?
      ORDER BY datetime(examined_at) DESC
      LIMIT 1
      `,
    )
    .get(patientId) as IntraoralExamination | undefined;

  return row ?? null;
};

export const upsertIntraoralExam = (
  patientId: string,
  payload: IntraoralPayload,
): IntraoralExamination => {
  ensurePatientExists(patientId);

  const existing = getLatestIntraoralExam(patientId);

  if (existing) {
    db.prepare(
      `
      UPDATE intraoral_examination
      SET
        examined_at = datetime('now'),
        soft_tissues = ?,
        periodontium = ?,
        occlusion = ?,
        oral_hygiene_status = ?,
        tooth_chart = ?,
        notes = ?
      WHERE id = ?
      `,
    ).run(
      nullableText(payload.soft_tissues),
      nullableText(payload.periodontium),
      nullableText(payload.occlusion),
      nullableText(payload.oral_hygiene_status),
      nullableText(payload.tooth_chart),
      nullableText(payload.notes),
      existing.id,
    );
  } else {
    db.prepare(
      `
      INSERT INTO intraoral_examination (
        id, patient_id, soft_tissues, periodontium,
        occlusion, oral_hygiene_status, tooth_chart, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      uuidv4(),
      patientId,
      nullableText(payload.soft_tissues),
      nullableText(payload.periodontium),
      nullableText(payload.occlusion),
      nullableText(payload.oral_hygiene_status),
      nullableText(payload.tooth_chart),
      nullableText(payload.notes),
    );
  }

  touchPatientUpdatedAt(patientId);

  return getLatestIntraoralExam(patientId)!;
};

export const listTreatmentPlans = (patientId: string): TreatmentPlan[] => {
  ensurePatientExists(patientId);
  return db
    .prepare(
      `
      SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
             clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
      FROM treatment_plans
      WHERE patient_id = ?
      ORDER BY datetime(created_at) DESC
      `,
    )
    .all(patientId) as TreatmentPlan[];
};

export const createTreatmentPlan = (
  patientId: string,
  payload: TreatmentPlanPayload,
): TreatmentPlan => {
  ensurePatientExists(patientId);

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO treatment_plans (
      id, patient_id, plan_text, clinician_name, clinician_signature,
      clinician_date, supervisor_name, supervisor_signature, supervisor_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    patientId,
    payload.plan_text.trim(),
    nullableText(payload.clinician_name),
    nullableText(payload.clinician_signature),
    nullableText(payload.clinician_date),
    nullableText(payload.supervisor_name),
    nullableText(payload.supervisor_signature),
    nullableText(payload.supervisor_date),
  );

  touchPatientUpdatedAt(patientId);

  return db
    .prepare(
      `
      SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
             clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
      FROM treatment_plans
      WHERE id = ?
      `,
    )
    .get(id) as TreatmentPlan;
};

export const updateTreatmentPlan = (
  patientId: string,
  planId: string,
  payload: TreatmentPlanPayload,
): TreatmentPlan | null => {
  ensurePatientExists(patientId);

  const result = db
    .prepare(
      `
      UPDATE treatment_plans
      SET plan_text = ?, clinician_name = ?, clinician_signature = ?, clinician_date = ?,
          supervisor_name = ?, supervisor_signature = ?, supervisor_date = ?
      WHERE id = ? AND patient_id = ?
      `,
    )
    .run(
      payload.plan_text.trim(),
      nullableText(payload.clinician_name),
      nullableText(payload.clinician_signature),
      nullableText(payload.clinician_date),
      nullableText(payload.supervisor_name),
      nullableText(payload.supervisor_signature),
      nullableText(payload.supervisor_date),
      planId,
      patientId,
    );

  if (result.changes === 0) {
    return null;
  }

  touchPatientUpdatedAt(patientId);

  return db
    .prepare(
      `
      SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
             clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
      FROM treatment_plans
      WHERE id = ?
      `,
    )
    .get(planId) as TreatmentPlan;
};

export const listTreatmentRecords = (patientId: string): TreatmentRecord[] => {
  ensurePatientExists(patientId);
  return db
    .prepare(
      `
      SELECT id, patient_id, treatment_date, tooth_number,
             procedure, clinician, clinical_supervisor, created_at
      FROM treatment_records
      WHERE patient_id = ?
      ORDER BY datetime(treatment_date) DESC, datetime(created_at) DESC
      `,
    )
    .all(patientId) as TreatmentRecord[];
};

export const createTreatmentRecord = (
  patientId: string,
  payload: TreatmentRecordPayload,
): TreatmentRecord => {
  ensurePatientExists(patientId);

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO treatment_records (
      id, patient_id, treatment_date, tooth_number, procedure, clinician, clinical_supervisor
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    patientId,
    payload.treatment_date.trim(),
    nullableText(payload.tooth_number),
    payload.procedure.trim(),
    nullableText(payload.clinician),
    nullableText(payload.clinical_supervisor),
  );

  touchPatientUpdatedAt(patientId);

  return db
    .prepare(
      `
      SELECT id, patient_id, treatment_date, tooth_number,
             procedure, clinician, clinical_supervisor, created_at
      FROM treatment_records
      WHERE id = ?
      `,
    )
    .get(id) as TreatmentRecord;
};

export const getPatientBundle = (patientId: string): PatientBundle | null => {
  const patient = getPatientById(patientId);
  if (!patient) {
    return null;
  }

  return {
    patient,
    medicalHistory: getMedicalHistory(patientId),
    dentalHistory: getDentalHistory(patientId),
    intraoralExam: getLatestIntraoralExam(patientId),
    treatmentPlans: listTreatmentPlans(patientId),
    treatmentRecords: listTreatmentRecords(patientId),
  };
};
