import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "crypto";
import fs from "fs";
import path from "path";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_PASSWORD,
  DEFAULT_PRACTITIONER_ID,
} from "@/lib/constants";

const DB_PATH = path.join(process.cwd(), "clinic.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    medical_alert TEXT,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    date_of_birth TEXT,
    age INTEGER,
    sex TEXT,
    civil_status TEXT,
    religion TEXT,
    occupation TEXT,
    nationality TEXT,
    height TEXT,
    weight TEXT,
    home_address TEXT,
    home_telephone TEXT,
    cellphone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_telephone TEXT,
    emergency_contact_address TEXT,
    relationship_to_patient TEXT,
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    review_status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medical_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,

    physician_name TEXT,
    physician_office_number TEXT,
    physician_office_address TEXT,

    in_good_health INTEGER DEFAULT 1,
    under_medical_treatment INTEGER DEFAULT 0,
    condition_being_treated TEXT,
    hospitalized INTEGER DEFAULT 0,
    hospitalization_reason TEXT,
    taking_medication INTEGER DEFAULT 0,
    medication_details TEXT,
    uses_tobacco INTEGER DEFAULT 0,
    uses_drugs INTEGER DEFAULT 0,
    drug_details TEXT,

    allergic_local_anesthetic INTEGER DEFAULT 0,
    allergic_penicillin INTEGER DEFAULT 0,
    allergic_aspirin INTEGER DEFAULT 0,
    allergic_latex INTEGER DEFAULT 0,
    allergic_others TEXT,

    is_pregnant INTEGER DEFAULT 0,
    is_nursing INTEGER DEFAULT 0,
    taking_birth_control INTEGER DEFAULT 0,

    blood_type TEXT,
    blood_pressure TEXT,
    pulse_rate TEXT,
    respiratory_rate TEXT,
    body_temperature TEXT,
    height TEXT,
    weight_vitals TEXT,

    has_high_blood_pressure INTEGER DEFAULT 0,
    has_low_blood_pressure INTEGER DEFAULT 0,
    has_epilepsy INTEGER DEFAULT 0,
    has_aids_hiv INTEGER DEFAULT 0,
    has_std INTEGER DEFAULT 0,
    has_stomach_troubles INTEGER DEFAULT 0,
    has_fainting_seizures INTEGER DEFAULT 0,
    has_rapid_weight_loss INTEGER DEFAULT 0,
    has_radiation_therapy INTEGER DEFAULT 0,
    has_joint_replacement INTEGER DEFAULT 0,
    has_diabetes INTEGER DEFAULT 0,
    has_heart_surgery INTEGER DEFAULT 0,
    has_heart_disease INTEGER DEFAULT 0,
    has_heart_murmur INTEGER DEFAULT 0,
    has_hepatitis_liver INTEGER DEFAULT 0,
    has_rheumatic_fever INTEGER DEFAULT 0,
    has_hay_fever INTEGER DEFAULT 0,
    has_respiratory_problems INTEGER DEFAULT 0,
    has_hepatitis_jaundice INTEGER DEFAULT 0,
    has_tuberculosis INTEGER DEFAULT 0,
    has_swollen_ankles INTEGER DEFAULT 0,
    has_kidney_disease INTEGER DEFAULT 0,
    has_chest_pain INTEGER DEFAULT 0,
    has_heart_attack INTEGER DEFAULT 0,
    has_cancer_tumors INTEGER DEFAULT 0,
    has_anemia INTEGER DEFAULT 0,
    has_angina INTEGER DEFAULT 0,
    has_asthma INTEGER DEFAULT 0,
    has_emphysema INTEGER DEFAULT 0,
    has_bleeding_problems INTEGER DEFAULT 0,
    has_blood_diseases INTEGER DEFAULT 0,
    has_head_injuries INTEGER DEFAULT 0,
    has_arthritis INTEGER DEFAULT 0,
    has_thyroid_problem INTEGER DEFAULT 0,
    has_stroke INTEGER DEFAULT 0,
    has_others TEXT,

    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS dental_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    frequency_of_dental_visit TEXT,
    date_of_last_dental_visit TEXT,
    procedures_done_on_last_visit TEXT,
    exposure_to_local_anesthesia TEXT,
    complications_during_after_procedure TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS intraoral_examination (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    examined_at TEXT DEFAULT (datetime('now')),
    soft_tissues TEXT,
    periodontium TEXT,
    occlusion TEXT,
    oral_hygiene_status TEXT,
    tooth_chart TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS treatment_plans (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    plan_text TEXT NOT NULL,
    clinician_name TEXT,
    clinician_signature TEXT,
    clinician_date TEXT,
    supervisor_name TEXT,
    supervisor_signature TEXT,
    supervisor_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS treatment_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    treatment_date TEXT NOT NULL,
    tooth_number TEXT,
    procedure TEXT NOT NULL,
    clinician TEXT,
    clinical_supervisor TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shell_title TEXT NOT NULL,
    shell_subtitle TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    add_patient_label TEXT NOT NULL,
    dashboard_title TEXT NOT NULL,
    dashboard_ledger_title TEXT NOT NULL DEFAULT 'The Curator''s Ledger',
    dashboard_description TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS practitioners (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    password TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Perform simple migrations for existing DB files that predate schema changes.
// This ensures newly added columns exist when the app is run against an older
// clinic.db created by a previous schema version.
const ensureColumnsExist = (table: string, columns: { name: string; type: string; def?: string }[]) => {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  const existingNames = new Set(existing.map((r) => r.name));

  for (const col of columns) {
    if (!existingNames.has(col.name)) {
      const def = col.def ? ` ${col.def}` : "";
      const sql = `ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}${def}`;
      try {
        db.prepare(sql).run();
      } catch (err) {
        // If migration fails, log to console but continue — runtime will throw later
        // if code expects the column. This keeps startup resilient during dev.
        // eslint-disable-next-line no-console
        console.warn("Failed to add column", col.name, "to table", table, err);
      }
    }
  }
};

ensureColumnsExist("patients", [
  { name: "medical_alert", type: "TEXT" },
  { name: "middle_name", type: "TEXT" },
  { name: "date_of_birth", type: "TEXT" },
  { name: "age", type: "INTEGER" },
  { name: "sex", type: "TEXT" },
  { name: "civil_status", type: "TEXT" },
  { name: "religion", type: "TEXT" },
  { name: "occupation", type: "TEXT" },
  { name: "nationality", type: "TEXT" },
  { name: "height", type: "TEXT" },
  { name: "weight", type: "TEXT" },
  { name: "home_address", type: "TEXT" },
  { name: "home_telephone", type: "TEXT" },
  { name: "cellphone", type: "TEXT" },
  { name: "emergency_contact_name", type: "TEXT" },
  { name: "emergency_contact_telephone", type: "TEXT" },
  { name: "emergency_contact_address", type: "TEXT" },
  { name: "relationship_to_patient", type: "TEXT" },
  { name: "chief_complaint", type: "TEXT" },
  { name: "history_of_present_illness", type: "TEXT" },
  { name: "review_status", type: "TEXT", def: "DEFAULT 'active'" },
  { name: "created_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
  { name: "updated_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

db.prepare(
  `
  UPDATE patients
  SET review_status = 'active'
  WHERE review_status IS NULL OR review_status = '' OR review_status = 'awaiting_review'
  `,
).run();

ensureColumnsExist("medical_history", [
  { name: "patient_id", type: "TEXT" },
  { name: "physician_name", type: "TEXT" },
  { name: "physician_office_number", type: "TEXT" },
  { name: "physician_office_address", type: "TEXT" },

  { name: "in_good_health", type: "INTEGER", def: "DEFAULT 1" },
  { name: "under_medical_treatment", type: "INTEGER", def: "DEFAULT 0" },
  { name: "condition_being_treated", type: "TEXT" },
  { name: "hospitalized", type: "INTEGER", def: "DEFAULT 0" },
  { name: "hospitalization_reason", type: "TEXT" },
  { name: "taking_medication", type: "INTEGER", def: "DEFAULT 0" },
  { name: "medication_details", type: "TEXT" },
  { name: "uses_tobacco", type: "INTEGER", def: "DEFAULT 0" },
  { name: "uses_drugs", type: "INTEGER", def: "DEFAULT 0" },
  { name: "drug_details", type: "TEXT" },

  { name: "allergic_local_anesthetic", type: "INTEGER", def: "DEFAULT 0" },
  { name: "allergic_penicillin", type: "INTEGER", def: "DEFAULT 0" },
  { name: "allergic_aspirin", type: "INTEGER", def: "DEFAULT 0" },
  { name: "allergic_latex", type: "INTEGER", def: "DEFAULT 0" },
  { name: "allergic_others", type: "TEXT" },

  { name: "is_pregnant", type: "INTEGER", def: "DEFAULT 0" },
  { name: "is_nursing", type: "INTEGER", def: "DEFAULT 0" },
  { name: "taking_birth_control", type: "INTEGER", def: "DEFAULT 0" },

  { name: "blood_type", type: "TEXT" },
  { name: "blood_pressure", type: "TEXT" },
  { name: "pulse_rate", type: "TEXT" },
  { name: "respiratory_rate", type: "TEXT" },
  { name: "body_temperature", type: "TEXT" },
  { name: "height", type: "TEXT" },
  { name: "weight_vitals", type: "TEXT" },

  // Common medical flags
  { name: "has_high_blood_pressure", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_low_blood_pressure", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_epilepsy", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_aids_hiv", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_std", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_stomach_troubles", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_fainting_seizures", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_rapid_weight_loss", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_radiation_therapy", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_joint_replacement", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_diabetes", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_heart_surgery", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_heart_disease", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_heart_murmur", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_hepatitis_liver", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_rheumatic_fever", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_hay_fever", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_respiratory_problems", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_hepatitis_jaundice", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_tuberculosis", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_swollen_ankles", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_kidney_disease", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_chest_pain", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_heart_attack", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_cancer_tumors", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_anemia", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_angina", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_asthma", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_emphysema", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_bleeding_problems", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_blood_diseases", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_head_injuries", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_arthritis", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_thyroid_problem", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_stroke", type: "INTEGER", def: "DEFAULT 0" },
  { name: "has_others", type: "TEXT" },
  { name: "notes", type: "TEXT" },
  { name: "updated_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

ensureColumnsExist("dental_history", [
  { name: "patient_id", type: "TEXT" },
  { name: "frequency_of_dental_visit", type: "TEXT" },
  { name: "date_of_last_dental_visit", type: "TEXT" },
  { name: "procedures_done_on_last_visit", type: "TEXT" },
  { name: "exposure_to_local_anesthesia", type: "TEXT" },
  { name: "complications_during_after_procedure", type: "TEXT" },
  { name: "updated_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

ensureColumnsExist("intraoral_examination", [
  { name: "patient_id", type: "TEXT" },
  { name: "examined_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
  { name: "soft_tissues", type: "TEXT" },
  { name: "periodontium", type: "TEXT" },
  { name: "occlusion", type: "TEXT" },
  { name: "oral_hygiene_status", type: "TEXT" },
  { name: "tooth_chart", type: "TEXT" },
  { name: "notes", type: "TEXT" },
]);

ensureColumnsExist("treatment_plans", [
  { name: "patient_id", type: "TEXT" },
  { name: "plan_text", type: "TEXT" },
  { name: "clinician_name", type: "TEXT" },
  { name: "clinician_signature", type: "TEXT" },
  { name: "clinician_date", type: "TEXT" },
  { name: "supervisor_name", type: "TEXT" },
  { name: "supervisor_signature", type: "TEXT" },
  { name: "supervisor_date", type: "TEXT" },
  { name: "created_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

ensureColumnsExist("treatment_records", [
  { name: "patient_id", type: "TEXT" },
  { name: "treatment_date", type: "TEXT" },
  { name: "tooth_number", type: "TEXT" },
  { name: "procedure", type: "TEXT" },
  { name: "clinician", type: "TEXT" },
  { name: "clinical_supervisor", type: "TEXT" },
  { name: "created_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

ensureColumnsExist("app_settings", [
  { name: "id", type: "INTEGER" },
  { name: "shell_title", type: "TEXT" },
  { name: "shell_subtitle", type: "TEXT" },
  { name: "clinic_name", type: "TEXT" },
  { name: "add_patient_label", type: "TEXT" },
  { name: "dashboard_title", type: "TEXT" },
  { name: "dashboard_ledger_title", type: "TEXT", def: "DEFAULT 'The Curator''s Ledger'" },
  { name: "dashboard_description", type: "TEXT" },
  { name: "updated_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

db.prepare(
  `
  UPDATE app_settings
  SET dashboard_ledger_title = 'The Curator''s Ledger'
  WHERE dashboard_ledger_title IS NULL OR dashboard_ledger_title = ''
  `,
).run();

ensureColumnsExist("practitioners", [
  { name: "id", type: "TEXT" },
  { name: "display_name", type: "TEXT" },
  { name: "password", type: "TEXT" },
  { name: "is_active", type: "INTEGER", def: "DEFAULT 1" },
  { name: "created_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
  { name: "updated_at", type: "TEXT", def: "DEFAULT (datetime('now'))" },
]);

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
    dashboard_description
  )
  VALUES (1, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO NOTHING
  `,
).run(
  DEFAULT_APP_SETTINGS.shell_title,
  DEFAULT_APP_SETTINGS.shell_subtitle,
  DEFAULT_APP_SETTINGS.clinic_name,
  DEFAULT_APP_SETTINGS.add_patient_label,
  DEFAULT_APP_SETTINGS.dashboard_title,
  DEFAULT_APP_SETTINGS.dashboard_ledger_title,
  DEFAULT_APP_SETTINGS.dashboard_description,
);

const configuredPractitionerId = process.env.CLINIC_PRACTITIONER_ID?.trim() || DEFAULT_PRACTITIONER_ID;
const configuredPassword = process.env.CLINIC_PASSWORD || DEFAULT_PASSWORD;

const hashForSeed = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const looksLikeLegacyPlainPassword = (value: string): boolean => {
  if (!value) {
    return false;
  }

  return !value.startsWith("scrypt:");
};

db.prepare(
  `
  INSERT INTO practitioners (id, display_name, password, is_active)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(id) DO NOTHING
  `,
).run(configuredPractitionerId, configuredPractitionerId, hashForSeed(configuredPassword));

const legacyPractitioners = db
  .prepare(
    `
    SELECT id, password
    FROM practitioners
    WHERE is_active = 1
    `,
  )
  .all() as { id: string; password: string }[];

for (const practitioner of legacyPractitioners) {
  if (!looksLikeLegacyPlainPassword(practitioner.password)) {
    continue;
  }

  db.prepare(
    `
    UPDATE practitioners
    SET password = ?, updated_at = datetime('now')
    WHERE id = ?
    `,
  ).run(hashForSeed(practitioner.password), practitioner.id);
}

// Simple migration tracking + backup: record that we've applied the basic
// schema additions so future runs don't attempt backups again. This is a
// minimal mechanism suitable for local development. For production you may
// prefer a full migration tool with transactional guarantees.
try {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, name TEXT, applied_at TEXT)`,
  ).run();

  const mig = db.prepare(`SELECT id FROM _migrations WHERE id = ?`).get("v1_schema_additions");
  if (!mig) {
    // create a quick filesystem backup of the DB before marking migration
    try {
      const dbPath = DB_PATH;
      if (fs.existsSync(dbPath)) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backup = `${dbPath}.bak-${stamp}`;
        fs.copyFileSync(dbPath, backup);
        // eslint-disable-next-line no-console
        console.info("Created DB backup:", backup);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("DB backup failed:", err);
    }

    db.prepare(`INSERT INTO _migrations (id, name, applied_at) VALUES (?, ?, datetime('now'))`).run(
      "v1_schema_additions",
      "Add missing columns for new schema",
    );
  }
} catch (err) {
  // Non-fatal: if migrations table cannot be created, continue — errors will
  // surface when code expects schema features.
  // eslint-disable-next-line no-console
  console.warn("Migration tracking failed:", err);
}

export default db;
