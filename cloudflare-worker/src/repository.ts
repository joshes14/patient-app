import { DEFAULT_APP_SETTINGS, DEFAULT_PASSWORD, DEFAULT_PRACTITIONER_ID } from "./constants";
import { dbAll, dbFirst, dbRun, getDb, type DbRunResult, type Env } from "./db";
import { hashPassword, needsPasswordHashUpgrade, verifyPassword } from "./password";
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
} from "./schema";
import type {
  AppSettingsPayload,
  DentalHistoryPayload,
  IntraoralPayload,
  MedicalHistoryPayload,
  PatientPayload,
  PractitionerPayload,
  TreatmentPlanPayload,
  TreatmentRecordPayload,
} from "./validators";

type LegacyAppSettings = Omit<AppSettings, "dashboard_ledger_title">;

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

const getPractitionerById = async (env: Env, practitionerId: string): Promise<Practitioner | null> => {
  const db = getDb(env);
  return dbFirst<Practitioner>(
    db,
    `
    SELECT id, display_name, is_active, created_at, updated_at
    FROM practitioners
    WHERE id = ?
    LIMIT 1
    `,
    [practitionerId],
  );
};

const touchPatientUpdatedAt = async (env: Env, patientId: string): Promise<void> => {
  const db = getDb(env);
  await dbRun(
    db,
    `
    UPDATE patients
    SET updated_at = datetime('now')
    WHERE id = ?
    `,
    [patientId],
  );
};

const generatePatientId = (): string => {
  const short = crypto.randomUUID().split("-")[0].toUpperCase();
  const year = new Date().getFullYear();
  return `PT-${year}-${short}`;
};

export const ensureSeedData = async (env: Env): Promise<void> => {
  const db = getDb(env);
  const practitionerId = env.CLINIC_PRACTITIONER_ID?.trim() || DEFAULT_PRACTITIONER_ID;
  const defaultPassword = env.CLINIC_PASSWORD ?? DEFAULT_PASSWORD;

  await dbRun(
    db,
    `
    INSERT OR IGNORE INTO app_settings (
      id,
      shell_title,
      shell_subtitle,
      clinic_name,
      add_patient_label,
      dashboard_title,
      dashboard_ledger_title,
      dashboard_description
    )
    VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      DEFAULT_APP_SETTINGS.shell_title,
      DEFAULT_APP_SETTINGS.shell_subtitle,
      DEFAULT_APP_SETTINGS.clinic_name,
      DEFAULT_APP_SETTINGS.add_patient_label,
      DEFAULT_APP_SETTINGS.dashboard_title,
      DEFAULT_APP_SETTINGS.dashboard_ledger_title,
      DEFAULT_APP_SETTINGS.dashboard_description,
    ],
  );

  await dbRun(
    db,
    `
    INSERT OR IGNORE INTO practitioners (id, display_name, password, is_active)
    VALUES (?, ?, ?, 1)
    `,
    [practitionerId, practitionerId, hashPassword(defaultPassword)],
  );
};

export const getAppSettings = async (env: Env): Promise<AppSettings> => {
  const db = getDb(env);

  try {
    const row = await dbFirst<AppSettings>(
      db,
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
    );

    if (row) {
      return row;
    }
  } catch {
    // Fall through to the legacy shape below.
  }

  try {
    const legacyRow = await dbFirst<LegacyAppSettings>(
      db,
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
    );

    if (legacyRow) {
      return {
        ...legacyRow,
        dashboard_ledger_title: DEFAULT_APP_SETTINGS.dashboard_ledger_title,
      };
    }
  } catch {
    // Ignore and return defaults.
  }

  return {
    ...DEFAULT_APP_SETTINGS,
    updated_at: new Date().toISOString(),
  };
};

export const updateAppSettings = async (env: Env, payload: AppSettingsPayload): Promise<AppSettings> => {
  const db = getDb(env);

  await dbRun(
    db,
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
    [
      payload.shell_title.trim(),
      payload.shell_subtitle.trim(),
      payload.clinic_name.trim(),
      payload.add_patient_label.trim(),
      payload.dashboard_title.trim(),
      payload.dashboard_ledger_title.trim(),
      payload.dashboard_description.trim(),
    ],
  );

  return getAppSettings(env);
};

export const listPractitioners = async (env: Env): Promise<Practitioner[]> => {
  const db = getDb(env);
  return dbAll<Practitioner>(
    db,
    `
    SELECT id, display_name, is_active, created_at, updated_at
    FROM practitioners
    ORDER BY is_active DESC, datetime(created_at) ASC
    `,
  );
};

export const checkPractitionerId = async (env: Env, input: string): Promise<boolean> => {
  const practitionerId = input.trim();
  if (practitionerId.length === 0) {
    return false;
  }

  const db = getDb(env);
  const row = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM practitioners
    WHERE id = ? AND is_active = 1
    LIMIT 1
    `,
    [practitionerId],
  );

  return Boolean(row?.id);
};

export const checkPassword = async (env: Env, practitionerId: string, input: string): Promise<boolean> => {
  const db = getDb(env);
  const row = await dbFirst<{ password: string }>(
    db,
    `
    SELECT password
    FROM practitioners
    WHERE id = ? AND is_active = 1
    LIMIT 1
    `,
    [practitionerId.trim()],
  );

  if (!row) {
    return false;
  }

  const isMatch = verifyPassword(input, row.password);
  if (isMatch && needsPasswordHashUpgrade(row.password)) {
    await dbRun(
      db,
      `
      UPDATE practitioners
      SET password = ?, updated_at = datetime('now')
      WHERE id = ?
      `,
      [hashPassword(input), practitionerId.trim()],
    );
  }

  return isMatch;
};

export const createPractitioner = async (
  env: Env,
  payload: PractitionerPayload,
): Promise<Practitioner> => {
  const db = getDb(env);
  const id = payload.id.trim();
  const displayName = payload.display_name.trim();

  await dbRun(
    db,
    `
    INSERT INTO practitioners (id, display_name, password, is_active)
    VALUES (?, ?, ?, 1)
    `,
    [id, displayName, hashPassword(payload.password)],
  );

  return (await getPractitionerById(env, id))!;
};

export const updatePractitionerPassword = async (
  env: Env,
  practitionerId: string,
  password: string,
): Promise<Practitioner | null> => {
  const db = getDb(env);
  const result = await dbRun(
    db,
    `
    UPDATE practitioners
    SET password = ?, updated_at = datetime('now')
    WHERE id = ?
    `,
    [hashPassword(password), practitionerId],
  );

  if (result.changes === 0) {
    return null;
  }

  return getPractitionerById(env, practitionerId);
};

export const deactivatePractitioner = async (
  env: Env,
  practitionerId: string,
): Promise<Practitioner | null> => {
  const db = getDb(env);
  const row = await dbFirst<{ id: string; is_active: number }>(
    db,
    `
    SELECT id, is_active
    FROM practitioners
    WHERE id = ?
    LIMIT 1
    `,
    [practitionerId],
  );

  if (!row) {
    return null;
  }

  if (row.is_active === 0) {
    return getPractitionerById(env, practitionerId);
  }

  const activeCount = await dbFirst<{ total: number }>(
    db,
    `
    SELECT COUNT(*) AS total
    FROM practitioners
    WHERE is_active = 1
    `,
  );

  if ((activeCount?.total ?? 0) <= 1) {
    throw new Error("LAST_ACTIVE_PRACTITIONER");
  }

  await dbRun(
    db,
    `
    UPDATE practitioners
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
    `,
    [practitionerId],
  );

  return getPractitionerById(env, practitionerId);
};

export const listPatients = async (
  env: Env,
  params?: {
    q?: string;
    sex?: string;
    review_status?: PatientReviewStatus | "all";
  },
): Promise<Patient[]> => {
  const db = getDb(env);
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

  return dbAll<Patient>(db, sql, binds);
};

export const getPatientById = async (env: Env, patientId: string): Promise<Patient | null> => {
  const db = getDb(env);
  return dbFirst<Patient>(
    db,
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
    [patientId],
  );
};

export const createPatient = async (env: Env, payload: PatientPayload): Promise<Patient> => {
  const db = getDb(env);
  const id = generatePatientId();

  await dbRun(
    db,
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
    [
      id,
      nullableText(payload.medical_alert),
      payload.last_name.trim(),
      payload.first_name.trim(),
      nullableText(payload.middle_name),
      nullableText(payload.date_of_birth),
      nullableNumber(payload.age),
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
    ],
  );

  return (await getPatientById(env, id))!;
};

export const updatePatient = async (env: Env, patientId: string, payload: PatientPayload): Promise<Patient> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  await dbRun(
    db,
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
    [
      payload.last_name.trim(),
      payload.first_name.trim(),
      nullableText(payload.middle_name),
      nullableText(payload.date_of_birth),
      nullableText(payload.sex),
      nullableNumber(payload.age),
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
    ],
  );

  return (await getPatientById(env, patientId))!;
};

export const updatePatientReviewStatus = async (
  env: Env,
  patientId: string,
  reviewStatus: PatientReviewStatus,
): Promise<Patient> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  await dbRun(
    db,
    `
    UPDATE patients
    SET review_status = ?, updated_at = datetime('now')
    WHERE id = ?
    `,
    [normalizeReviewStatus(reviewStatus), patientId],
  );

  return (await getPatientById(env, patientId))!;
};

export const deletePatient = async (env: Env, patientId: string): Promise<boolean> => {
  const db = getDb(env);
  const result = await dbRun(
    db,
    `
    DELETE FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  return result.changes > 0;
};

export const getMedicalHistory = async (env: Env, patientId: string): Promise<MedicalHistory | null> => {
  const db = getDb(env);
  return dbFirst<MedicalHistory>(
    db,
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
           has_arthritis, has_thyroid_problem, has_stroke, has_others, notes,

           updated_at
    FROM medical_history
    WHERE patient_id = ?
    LIMIT 1
    `,
    [patientId],
  );
};

export const upsertMedicalHistory = async (
  env: Env,
  patientId: string,
  payload: MedicalHistoryPayload,
): Promise<MedicalHistory> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const existing = await getMedicalHistory(env, patientId);

  if (existing) {
    await dbRun(
      db,
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
        has_head_injuries = ?, has_arthritis = ?, has_thyroid_problem = ?, has_stroke = ?, has_others = ?, notes = ?,

        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
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
        nullableText(payload.notes),

        existing.id,
      ],
    );
  } else {
    await dbRun(
      db,
      `
      INSERT INTO medical_history (
        id, patient_id, physician_name, physician_office_number, physician_office_address,

        in_good_health, under_medical_treatment, condition_being_treated,
        hospitalized, hospitalization_reason, taking_medication, medication_details,
        uses_tobacco, uses_drugs, drug_details,

        allergic_local_anesthetic, allergic_penicillin, allergic_aspirin, allergic_latex, allergic_others,

        is_pregnant, is_nursing, taking_birth_control,

        blood_type, blood_pressure, pulse_rate, respiratory_rate, body_temperature, height, weight_vitals,

        has_high_blood_pressure, has_low_blood_pressure, has_epilepsy, has_aids_hiv, has_std, has_stomach_troubles,
        has_fainting_seizures, has_rapid_weight_loss, has_radiation_therapy, has_joint_replacement,
        has_diabetes, has_heart_surgery, has_heart_disease, has_heart_murmur, has_hepatitis_liver,
        has_rheumatic_fever, has_hay_fever, has_respiratory_problems, has_hepatitis_jaundice, has_tuberculosis,
        has_swollen_ankles, has_kidney_disease, has_chest_pain, has_heart_attack, has_cancer_tumors,
        has_anemia, has_angina, has_asthma, has_emphysema, has_bleeding_problems, has_blood_diseases,
        has_head_injuries, has_arthritis, has_thyroid_problem, has_stroke, has_others, notes
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      `,
      [
        crypto.randomUUID(),
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
        nullableText(payload.notes),
      ],
    );
  }

  await touchPatientUpdatedAt(env, patientId);

  return (await getMedicalHistory(env, patientId))!;
};

export const getDentalHistory = async (env: Env, patientId: string): Promise<DentalHistory | null> => {
  const db = getDb(env);
  return dbFirst<DentalHistory>(
    db,
    `
    SELECT id, patient_id, frequency_of_dental_visit,
           date_of_last_dental_visit, procedures_done_on_last_visit,
           exposure_to_local_anesthesia, complications_during_after_procedure, updated_at
    FROM dental_history
    WHERE patient_id = ?
    LIMIT 1
    `,
    [patientId],
  );
};

export const upsertDentalHistory = async (
  env: Env,
  patientId: string,
  payload: DentalHistoryPayload,
): Promise<DentalHistory> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const existing = await getDentalHistory(env, patientId);

  if (existing) {
    await dbRun(
      db,
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
      [
        nullableText(payload.frequency_of_dental_visit),
        nullableText(payload.date_of_last_dental_visit),
        nullableText(payload.procedures_done_on_last_visit),
        nullableText(payload.exposure_to_local_anesthesia),
        nullableText(payload.complications_during_after_procedure),
        existing.id,
      ],
    );
  } else {
    await dbRun(
      db,
      `
      INSERT INTO dental_history (
        id, patient_id, frequency_of_dental_visit, date_of_last_dental_visit,
        procedures_done_on_last_visit, exposure_to_local_anesthesia, complications_during_after_procedure
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        patientId,
        nullableText(payload.frequency_of_dental_visit),
        nullableText(payload.date_of_last_dental_visit),
        nullableText(payload.procedures_done_on_last_visit),
        nullableText(payload.exposure_to_local_anesthesia),
        nullableText(payload.complications_during_after_procedure),
      ],
    );
  }

  await touchPatientUpdatedAt(env, patientId);

  return (await getDentalHistory(env, patientId))!;
};

export const getLatestIntraoralExam = async (
  env: Env,
  patientId: string,
): Promise<IntraoralExamination | null> => {
  const db = getDb(env);
  return dbFirst<IntraoralExamination>(
    db,
    `
    SELECT id, patient_id, examined_at, soft_tissues, periodontium,
           occlusion, oral_hygiene_status, tooth_chart, notes
    FROM intraoral_examination
    WHERE patient_id = ?
    ORDER BY datetime(examined_at) DESC
    LIMIT 1
    `,
    [patientId],
  );
};

export const upsertIntraoralExam = async (
  env: Env,
  patientId: string,
  payload: IntraoralPayload,
): Promise<IntraoralExamination> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const existing = await getLatestIntraoralExam(env, patientId);

  if (existing) {
    await dbRun(
      db,
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
      [
        nullableText(payload.soft_tissues),
        nullableText(payload.periodontium),
        nullableText(payload.occlusion),
        nullableText(payload.oral_hygiene_status),
        nullableText(payload.tooth_chart),
        nullableText(payload.notes),
        existing.id,
      ],
    );
  } else {
    await dbRun(
      db,
      `
      INSERT INTO intraoral_examination (
        id, patient_id, soft_tissues, periodontium,
        occlusion, oral_hygiene_status, tooth_chart, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        patientId,
        nullableText(payload.soft_tissues),
        nullableText(payload.periodontium),
        nullableText(payload.occlusion),
        nullableText(payload.oral_hygiene_status),
        nullableText(payload.tooth_chart),
        nullableText(payload.notes),
      ],
    );
  }

  await touchPatientUpdatedAt(env, patientId);

  return (await getLatestIntraoralExam(env, patientId))!;
};

export const listTreatmentPlans = async (env: Env, patientId: string): Promise<TreatmentPlan[]> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  return dbAll<TreatmentPlan>(
    db,
    `
    SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
           clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
    FROM treatment_plans
    WHERE patient_id = ?
    ORDER BY datetime(created_at) DESC
    `,
    [patientId],
  );
};

export const createTreatmentPlan = async (
  env: Env,
  patientId: string,
  payload: TreatmentPlanPayload,
): Promise<TreatmentPlan> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const id = crypto.randomUUID();

  await dbRun(
    db,
    `
    INSERT INTO treatment_plans (
      id, patient_id, plan_text, clinician_name, clinician_signature,
      clinician_date, supervisor_name, supervisor_signature, supervisor_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      patientId,
      payload.plan_text.trim(),
      nullableText(payload.clinician_name),
      nullableText(payload.clinician_signature),
      nullableText(payload.clinician_date),
      nullableText(payload.supervisor_name),
      nullableText(payload.supervisor_signature),
      nullableText(payload.supervisor_date),
    ],
  );

  await touchPatientUpdatedAt(env, patientId);

  return (
    await dbFirst<TreatmentPlan>(
      db,
      `
      SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
             clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
      FROM treatment_plans
      WHERE id = ?
      `,
      [id],
    )
  )!;
};

export const updateTreatmentPlan = async (
  env: Env,
  patientId: string,
  planId: string,
  payload: TreatmentPlanPayload,
): Promise<TreatmentPlan | null> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const result = await dbRun(
    db,
    `
    UPDATE treatment_plans
    SET plan_text = ?, clinician_name = ?, clinician_signature = ?, clinician_date = ?,
        supervisor_name = ?, supervisor_signature = ?, supervisor_date = ?
    WHERE id = ? AND patient_id = ?
    `,
    [
      payload.plan_text.trim(),
      nullableText(payload.clinician_name),
      nullableText(payload.clinician_signature),
      nullableText(payload.clinician_date),
      nullableText(payload.supervisor_name),
      nullableText(payload.supervisor_signature),
      nullableText(payload.supervisor_date),
      planId,
      patientId,
    ],
  );

  if (result.changes === 0) {
    return null;
  }

  await touchPatientUpdatedAt(env, patientId);

  return dbFirst<TreatmentPlan>(
    db,
    `
    SELECT id, patient_id, plan_text, clinician_name, clinician_signature,
           clinician_date, supervisor_name, supervisor_signature, supervisor_date, created_at
    FROM treatment_plans
    WHERE id = ?
    `,
    [planId],
  );
};

export const deleteTreatmentPlan = async (env: Env, patientId: string, planId: string): Promise<boolean> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const result = await dbRun(
    db,
    `
    DELETE FROM treatment_plans
    WHERE id = ? AND patient_id = ?
    `,
    [planId, patientId],
  );

  if (result.changes === 0) {
    return false;
  }

  await touchPatientUpdatedAt(env, patientId);
  return true;
};

export const listTreatmentRecords = async (env: Env, patientId: string): Promise<TreatmentRecord[]> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  return dbAll<TreatmentRecord>(
    db,
    `
    SELECT id, patient_id, treatment_date, tooth_number,
           procedure, clinician, clinical_supervisor, created_at
    FROM treatment_records
    WHERE patient_id = ?
    ORDER BY datetime(treatment_date) DESC, datetime(created_at) DESC
    `,
    [patientId],
  );
};

export const createTreatmentRecord = async (
  env: Env,
  patientId: string,
  payload: TreatmentRecordPayload,
): Promise<TreatmentRecord> => {
  const db = getDb(env);
  const exists = await dbFirst<{ id: string }>(
    db,
    `
    SELECT id
    FROM patients
    WHERE id = ?
    `,
    [patientId],
  );

  if (!exists) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  const id = crypto.randomUUID();

  await dbRun(
    db,
    `
    INSERT INTO treatment_records (
      id, patient_id, treatment_date, tooth_number, procedure, clinician, clinical_supervisor
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      patientId,
      payload.treatment_date.trim(),
      nullableText(payload.tooth_number),
      payload.procedure.trim(),
      nullableText(payload.clinician),
      nullableText(payload.clinical_supervisor),
    ],
  );

  await touchPatientUpdatedAt(env, patientId);

  return (
    await dbFirst<TreatmentRecord>(
      db,
      `
      SELECT id, patient_id, treatment_date, tooth_number,
             procedure, clinician, clinical_supervisor, created_at
      FROM treatment_records
      WHERE id = ?
      `,
      [id],
    )
  )!;
};

export const getPatientBundle = async (env: Env, patientId: string): Promise<PatientBundle | null> => {
  const patient = await getPatientById(env, patientId);
  if (!patient) {
    return null;
  }

  return {
    patient,
    medicalHistory: await getMedicalHistory(env, patientId),
    dentalHistory: await getDentalHistory(env, patientId),
    intraoralExam: await getLatestIntraoralExam(env, patientId),
    treatmentPlans: await listTreatmentPlans(env, patientId),
    treatmentRecords: await listTreatmentRecords(env, patientId),
  };
};
