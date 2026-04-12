# 📋 Form Update Instructions
### Based on: EAC School of Dental Medicine — Oral Diagnosis Section Patient's Chart

This document tells you exactly what fields to add, remove, or change in your database schema and forms to be faithful to the actual physical chart used at the clinic.

---

## 🗂️ Section 1: Patient Information Record

### Update `patients` table in `lib/db.ts`

**ADD these columns** (missing from original schema):

```sql
ALTER TABLE patients ADD COLUMN medical_alert TEXT;
ALTER TABLE patients ADD COLUMN age INTEGER;
ALTER TABLE patients ADD COLUMN civil_status TEXT;
ALTER TABLE patients ADD COLUMN religion TEXT;
ALTER TABLE patients ADD COLUMN occupation TEXT;
ALTER TABLE patients ADD COLUMN nationality TEXT;
ALTER TABLE patients ADD COLUMN height TEXT;
ALTER TABLE patients ADD COLUMN weight TEXT;
ALTER TABLE patients ADD COLUMN home_address TEXT;
ALTER TABLE patients ADD COLUMN home_telephone TEXT;
ALTER TABLE patients ADD COLUMN cellphone TEXT;
ALTER TABLE patients ADD COLUMN emergency_contact_telephone TEXT;
ALTER TABLE patients ADD COLUMN emergency_contact_address TEXT;
ALTER TABLE patients ADD COLUMN relationship_to_patient TEXT;
ALTER TABLE patients ADD COLUMN chief_complaint TEXT;
ALTER TABLE patients ADD COLUMN history_of_present_illness TEXT;
```

**RENAME** (to match chart exactly):
- `contact_number` → `cellphone`
- `emergency_contact_name` → `emergency_contact_name` ✅ (keep)
- `emergency_contact_number` → `emergency_contact_cellphone`
- `address` → `home_address`

**REMOVE** (not on the chart):
- `email` — not present on the physical form

### Patient Information Form Fields (in order)

| Field | Type | Notes |
|---|---|---|
| Medical Alert | `textarea` | Top of form, prominent warning area |
| Full Name (Last, First, Middle Initial) | 3x `text input` | Separate fields |
| Date of Birth | `date` | |
| Age | `number` | |
| Gender | `select` | Male / Female |
| Civil Status | `select` | Single / Married / Widowed / Separated |
| Religion | `text` | |
| Occupation | `text` | |
| Nationality | `text` | |
| Height | `text` | |
| Weight | `text` | |
| Home Address | `textarea` | |
| Home Telephone No. | `text` | |
| Home Cellphone No. | `text` | |
| In Case of Emergency (Name) | `text` | |
| Emergency Telephone No. | `text` | |
| Emergency Cellphone No. | `text` | |
| Emergency Address | `textarea` | |
| Relationship to Patient | `text` | |
| Chief Complaint | `textarea` | |
| History of Present Illness | `textarea` | |

---

## 🦷 Section 2: Dental History

### Update `dental_history` table

**REPLACE the entire table definition** with:

```sql
CREATE TABLE IF NOT EXISTS dental_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  frequency_of_dental_visit TEXT,
  date_of_last_dental_visit TEXT,
  procedures_done_on_last_visit TEXT,
  exposure_to_local_anesthesia TEXT,
  complications_during_after_procedure TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

**REMOVE** these fields from the old schema (not on chart):
- `previous_dentist`
- `chief_complaint` (moved to Patient Info)
- `has_bad_experience`
- `experience_details`
- `is_anxious`
- `notes`

### Dental History Form Fields (in order)

| Field | Type |
|---|---|
| Frequency of dental visit | `text` |
| Date of last dental visit | `date` |
| Procedure/s done on last dental visit | `text` |
| Exposure and response to local anesthesia | `textarea` |
| Complications during and/or after dental procedure | `textarea` |

---

## 🏥 Section 3: Medical History

### Update `medical_history` table

**REPLACE the entire table definition** with:

```sql
CREATE TABLE IF NOT EXISTS medical_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,

  -- Physician Info
  physician_name TEXT,
  physician_office_number TEXT,
  physician_office_address TEXT,

  -- Questions 1–9 (Yes/No)
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

  -- Q8: Allergies (checkboxes)
  allergic_local_anesthetic INTEGER DEFAULT 0,
  allergic_penicillin INTEGER DEFAULT 0,
  allergic_aspirin INTEGER DEFAULT 0,
  allergic_latex INTEGER DEFAULT 0,
  allergic_others TEXT,

  -- Q9: Women only
  is_pregnant INTEGER DEFAULT 0,
  is_nursing INTEGER DEFAULT 0,
  taking_birth_control INTEGER DEFAULT 0,

  -- Q10–11: Vitals
  blood_type TEXT,
  blood_pressure TEXT,
  pulse_rate TEXT,
  respiratory_rate TEXT,
  body_temperature TEXT,
  height TEXT,
  weight_vitals TEXT,

  -- Q12: Conditions checklist (all checkboxes)
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
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

### Medical History Form Layout

Render as a questionnaire with Yes/No radio buttons, matching the physical form:

| # | Question | Input Type |
|---|---|---|
| — | Name of Physician | `text` |
| — | Office Number | `text` |
| — | Office Address | `text` |
| 1 | Are you in good health? | `radio` Yes/No |
| 2 | Are you in medical treatment now? | `radio` Yes/No + `text` (condition) |
| 3 | Ever hospitalized for serious illness/surgery? | `radio` Yes/No + `text` (details) |
| 4 | Ever been hospitalized? | `radio` Yes/No + `text` (when & why) |
| 5 | Taking any prescription/non-prescription medication? | `radio` Yes/No + `text` (specify) |
| 6 | Use tobacco products? | `radio` Yes/No |
| 7 | Use alcohol, cocaine, or dangerous drugs? | `radio` Yes/No |
| 8 | Allergic to any of the following? | `checkbox` group: Local Anesthetic (Lidocaine), Penicillin Antibiotics, Aspirin, Latex, Others |
| 9 | For women only: Pregnant? Nursing? Taking birth control? | `radio` Yes/No (×3) |
| 10 | Blood Type | `text` |
| 11 | Blood Pressure / Pulse Rate / Respiratory Rate / Body Temperature / Height / Weight | `text` fields |
| 12 | Do you have or have you had any of the following? | `checkbox` grid (see list below) |

**Q12 Checkbox Grid** (render in 3 columns to match the form):

```
Column 1              Column 2                  Column 3
High Blood Pressure   Heart Disease             Cancer / Tumors
Low Blood Pressure    Heart Murmur              Anemia
Epilepsy/Convulsions  Hepatitis/Liver Disease   Angina
AIDS or HIV Infection Rheumatic Fever           Asthma
Sexually Transmitted  Hay Fever / Allergies     Emphysema
Stomach Troubles      Respiratory Problems      Bleeding Problems
Fainting Seizures     Hepatitis / Jaundice      Blood Diseases
Rapid Weight Loss     Tuberculosis              Head Injuries
Radiation Therapy     Swollen Ankles            Arthritis/Rheumatism
Joint Replacement     Kidney Disease            Thyroid Problem
Diabetes              Chest Pain                Stroke
Heart Surgery         Heart Attack              OTHERS: ______
```

---

## 📝 Section 4: Treatment Plan

### Update `treatment_plans` table

```sql
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
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

> **Note:** The physical form has a free-text area for the treatment plan (not per-tooth rows), followed by signature blocks for the Clinician-Learner and Clinical Supervisor. Model it as a `textarea` + signature/date fields.

### Treatment Plan Form Fields

| Field | Type |
|---|---|
| Treatment Plan (free text) | `textarea` (large) |
| Patient Examination performed by (Clinician-Learner Name) | `text` |
| Date | `date` |
| Approved by (Clinical Supervisor Name) | `text` |
| Supervisor Date | `date` |

---

## 🗃️ Section 5: Treatment Record

### Update `treatment_records` table

```sql
CREATE TABLE IF NOT EXISTS treatment_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  treatment_date TEXT NOT NULL,
  tooth_number TEXT,
  procedure TEXT NOT NULL,
  clinician TEXT,
  clinical_supervisor TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

**REMOVE** from old schema (not on physical form):
- `amount_charged`
- `amount_paid`
- `next_appointment`
- `notes`

### Treatment Record Table Columns (in order)

| Column | Type | Notes |
|---|---|---|
| Date | `date` | |
| Tooth No./s | `text` | Can be multiple tooth numbers |
| Procedure | `text` | |
| Clinician | `text` | Name of clinician who performed |
| Clinical Supervisor | `text` | Signature over printed name |

Render this as an **addable row table** — clicking "+ Add Row" appends a new treatment entry.

---

## ✅ Summary of Changes

| Section | Action |
|---|---|
| Patient Info | Add Medical Alert, vitals fields, civil status, religion, nationality, etc. Remove email. |
| Dental History | Simplify to 5 fields only (frequency, last visit, procedures, anesthesia, complications) |
| Medical History | Full rewrite — add all 12 questions, allergy checkboxes, Q12 conditions grid |
| Treatment Plan | Change from per-tooth rows to free-text + signature blocks |
| Treatment Record | Remove payment fields; add Clinician and Clinical Supervisor columns |

---

## 🗒️ Implementation Order (Suggested)

1. Update `lib/db.ts` with new table definitions
2. Update Patient Info form (`app/patients/new/page.tsx`)
3. Update Medical History form (biggest change — build Q12 as a checkbox grid component)
4. Update Dental History form (simplest — just 5 fields)
5. Update Treatment Plan form
6. Update Treatment Record table (addable rows)
7. Test with sample patient data