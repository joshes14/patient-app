import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().nullable();

export const patientPayloadSchema = z.object({
  last_name: z.string().trim().min(1).max(120),
  first_name: z.string().trim().min(1).max(120),
  middle_name: z.string().trim().max(120).optional().nullable(),
  date_of_birth: z.string().trim().max(40).optional().nullable(),
  age: z.number().int().nonnegative().optional().nullable(),
  sex: z.string().trim().max(30).optional().nullable(),
  civil_status: z.string().trim().max(60).optional().nullable(),
  religion: z.string().trim().max(120).optional().nullable(),
  occupation: z.string().trim().max(180).optional().nullable(),
  nationality: z.string().trim().max(120).optional().nullable(),
  height: z.string().trim().max(60).optional().nullable(),
  weight: z.string().trim().max(60).optional().nullable(),
  home_address: z.string().trim().max(400).optional().nullable(),
  home_telephone: z.string().trim().max(80).optional().nullable(),
  cellphone: z.string().trim().max(80).optional().nullable(),
  medical_alert: z.string().trim().max(1000).optional().nullable(),
  emergency_contact_name: z.string().trim().max(180).optional().nullable(),
  emergency_contact_telephone: z.string().trim().max(80).optional().nullable(),
  emergency_contact_address: z.string().trim().max(400).optional().nullable(),
  relationship_to_patient: z.string().trim().max(120).optional().nullable(),
  chief_complaint: z.string().trim().max(1000).optional().nullable(),
  history_of_present_illness: z.string().trim().max(2000).optional().nullable(),
  review_status: z.enum(["active", "archived"]).optional(),
});

export const patientStatusPayloadSchema = z.object({
  review_status: z.enum(["active", "archived"]),
});

export const medicalHistoryPayloadSchema = z.object({
  physician_name: optionalText,
  physician_office_number: optionalText,
  physician_office_address: optionalText,

  in_good_health: z.boolean().optional().default(true),
  under_medical_treatment: z.boolean().optional().default(false),
  condition_being_treated: optionalText,
  hospitalized: z.boolean().optional().default(false),
  hospitalization_reason: optionalText,
  taking_medication: z.boolean().optional().default(false),
  medication_details: optionalText,
  uses_tobacco: z.boolean().optional().default(false),
  uses_drugs: z.boolean().optional().default(false),
  drug_details: optionalText,

  allergic_local_anesthetic: z.boolean().optional().default(false),
  allergic_penicillin: z.boolean().optional().default(false),
  allergic_aspirin: z.boolean().optional().default(false),
  allergic_latex: z.boolean().optional().default(false),
  allergic_others: optionalText,

  is_pregnant: z.boolean().optional().default(false),
  is_nursing: z.boolean().optional().default(false),
  taking_birth_control: z.boolean().optional().default(false),

  blood_type: optionalText,
  blood_pressure: optionalText,
  pulse_rate: optionalText,
  respiratory_rate: optionalText,
  body_temperature: optionalText,
  height: optionalText,
  weight_vitals: optionalText,

  has_high_blood_pressure: z.boolean().optional().default(false),
  has_low_blood_pressure: z.boolean().optional().default(false),
  has_epilepsy: z.boolean().optional().default(false),
  has_aids_hiv: z.boolean().optional().default(false),
  has_std: z.boolean().optional().default(false),
  has_stomach_troubles: z.boolean().optional().default(false),
  has_fainting_seizures: z.boolean().optional().default(false),
  has_rapid_weight_loss: z.boolean().optional().default(false),
  has_radiation_therapy: z.boolean().optional().default(false),
  has_joint_replacement: z.boolean().optional().default(false),
  has_diabetes: z.boolean().optional().default(false),
  has_heart_surgery: z.boolean().optional().default(false),
  has_heart_disease: z.boolean().optional().default(false),
  has_heart_murmur: z.boolean().optional().default(false),
  has_hepatitis_liver: z.boolean().optional().default(false),
  has_rheumatic_fever: z.boolean().optional().default(false),
  has_hay_fever: z.boolean().optional().default(false),
  has_respiratory_problems: z.boolean().optional().default(false),
  has_hepatitis_jaundice: z.boolean().optional().default(false),
  has_tuberculosis: z.boolean().optional().default(false),
  has_swollen_ankles: z.boolean().optional().default(false),
  has_kidney_disease: z.boolean().optional().default(false),
  has_chest_pain: z.boolean().optional().default(false),
  has_heart_attack: z.boolean().optional().default(false),
  has_cancer_tumors: z.boolean().optional().default(false),
  has_anemia: z.boolean().optional().default(false),
  has_angina: z.boolean().optional().default(false),
  has_asthma: z.boolean().optional().default(false),
  has_emphysema: z.boolean().optional().default(false),
  has_bleeding_problems: z.boolean().optional().default(false),
  has_blood_diseases: z.boolean().optional().default(false),
  has_head_injuries: z.boolean().optional().default(false),
  has_arthritis: z.boolean().optional().default(false),
  has_thyroid_problem: z.boolean().optional().default(false),
  has_stroke: z.boolean().optional().default(false),
  has_others: optionalText,
  notes: optionalText,
});

export const dentalHistoryPayloadSchema = z.object({
  frequency_of_dental_visit: z.string().trim().max(200).optional().nullable(),
  date_of_last_dental_visit: z.string().trim().max(40).optional().nullable(),
  procedures_done_on_last_visit: z.string().trim().max(1000).optional().nullable(),
  exposure_to_local_anesthesia: z.string().trim().max(1000).optional().nullable(),
  complications_during_after_procedure: z.string().trim().max(2000).optional().nullable(),
});

export const intraoralPayloadSchema = z.object({
  soft_tissues: optionalText,
  periodontium: optionalText,
  occlusion: optionalText,
  oral_hygiene_status: optionalText,
  tooth_chart: optionalText,
  notes: optionalText,
});

export const treatmentPlanPayloadSchema = z.object({
  plan_text: z.string().trim().min(1).max(5000),
  clinician_name: z.string().trim().max(240).optional().nullable(),
  clinician_signature: z.string().trim().max(500).optional().nullable(),
  clinician_date: z.string().trim().max(40).optional().nullable(),
  supervisor_name: z.string().trim().max(240).optional().nullable(),
  supervisor_signature: z.string().trim().max(500).optional().nullable(),
  supervisor_date: z.string().trim().max(40).optional().nullable(),
});

export const treatmentRecordPayloadSchema = z.object({
  treatment_date: z.string().trim().min(1).max(40),
  tooth_number: z.string().trim().max(200).optional().nullable(),
  procedure: z.string().trim().min(1).max(1000),
  clinician: z.string().trim().max(240).optional().nullable(),
  clinical_supervisor: z.string().trim().max(240).optional().nullable(),
});

export const appSettingsPayloadSchema = z.object({
  shell_title: z.string().trim().min(1).max(120),
  shell_subtitle: z.string().trim().min(1).max(120),
  clinic_name: z.string().trim().min(1).max(120),
  add_patient_label: z.string().trim().min(1).max(80),
  dashboard_title: z.string().trim().min(1).max(160),
  dashboard_ledger_title: z.string().trim().min(1).max(160),
  dashboard_description: z.string().trim().min(1).max(500),
});

export const practitionerPayloadSchema = z.object({
  id: z.string().trim().min(1).max(80),
  display_name: z.string().trim().min(1).max(120),
  password: z.string().min(4).max(120),
});

export const practitionerPasswordPayloadSchema = z.object({
  password: z.string().min(4).max(120),
});

export type PatientPayload = z.infer<typeof patientPayloadSchema>;
export type MedicalHistoryPayload = z.infer<typeof medicalHistoryPayloadSchema>;
export type DentalHistoryPayload = z.infer<typeof dentalHistoryPayloadSchema>;
export type IntraoralPayload = z.infer<typeof intraoralPayloadSchema>;
export type TreatmentPlanPayload = z.infer<typeof treatmentPlanPayloadSchema>;
export type TreatmentRecordPayload = z.infer<typeof treatmentRecordPayloadSchema>;
export type AppSettingsPayload = z.infer<typeof appSettingsPayloadSchema>;
export type PractitionerPayload = z.infer<typeof practitionerPayloadSchema>;
