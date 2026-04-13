-- Initial D1 schema for patientapp

CREATE TABLE app_settings (
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

CREATE TABLE practitioners (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  password TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE patients (
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

CREATE TABLE medical_history (
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
  notes TEXT,

  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE dental_history (
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

CREATE TABLE intraoral_examination (
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

CREATE TABLE treatment_plans (
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

CREATE TABLE treatment_records (
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

CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_created ON patients(created_at);
CREATE INDEX idx_patients_status ON patients(review_status);
