export type PatientReviewStatus = "active" | "archived";

export type Patient = {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  sex: string | null;
  civil_status: string | null;
  religion: string | null;
  occupation: string | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  home_address: string | null;
  home_telephone: string | null;
  cellphone: string | null;
  medical_alert: string | null;
  emergency_contact_name: string | null;
  emergency_contact_telephone: string | null;
  emergency_contact_address: string | null;
  relationship_to_patient: string | null;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  review_status: PatientReviewStatus;
  created_at: string;
  updated_at: string;
};

export type MedicalHistory = {
  id: string;
  patient_id: string;
  physician_name: string | null;
  physician_office_number: string | null;
  physician_office_address: string | null;

  in_good_health: number;
  under_medical_treatment: number;
  condition_being_treated: string | null;
  hospitalized: number;
  hospitalization_reason: string | null;
  taking_medication: number;
  medication_details: string | null;
  uses_tobacco: number;
  uses_drugs: number;
  drug_details: string | null;

  allergic_local_anesthetic: number;
  allergic_penicillin: number;
  allergic_aspirin: number;
  allergic_latex: number;
  allergic_others: string | null;

  is_pregnant: number;
  is_nursing: number;
  taking_birth_control: number;

  blood_type: string | null;
  blood_pressure: string | null;
  pulse_rate: string | null;
  respiratory_rate: string | null;
  body_temperature: string | null;
  height: string | null;
  weight_vitals: string | null;

  has_high_blood_pressure: number;
  has_low_blood_pressure: number;
  has_epilepsy: number;
  has_aids_hiv: number;
  has_std: number;
  has_stomach_troubles: number;
  has_fainting_seizures: number;
  has_rapid_weight_loss: number;
  has_radiation_therapy: number;
  has_joint_replacement: number;
  has_diabetes: number;
  has_heart_surgery: number;
  has_heart_disease: number;
  has_heart_murmur: number;
  has_hepatitis_liver: number;
  has_rheumatic_fever: number;
  has_hay_fever: number;
  has_respiratory_problems: number;
  has_hepatitis_jaundice: number;
  has_tuberculosis: number;
  has_swollen_ankles: number;
  has_kidney_disease: number;
  has_chest_pain: number;
  has_heart_attack: number;
  has_cancer_tumors: number;
  has_anemia: number;
  has_angina: number;
  has_asthma: number;
  has_emphysema: number;
  has_bleeding_problems: number;
  has_blood_diseases: number;
  has_head_injuries: number;
  has_arthritis: number;
  has_thyroid_problem: number;
  has_stroke: number;
  has_others: string | null;

  notes: string | null;

  updated_at: string;
};

export type DentalHistory = {
  id: string;
  patient_id: string;
  frequency_of_dental_visit: string | null;
  date_of_last_dental_visit: string | null;
  procedures_done_on_last_visit: string | null;
  exposure_to_local_anesthesia: string | null;
  complications_during_after_procedure: string | null;
  updated_at: string;
};

export type IntraoralExamination = {
  id: string;
  patient_id: string;
  examined_at: string;
  soft_tissues: string | null;
  periodontium: string | null;
  occlusion: string | null;
  oral_hygiene_status: string | null;
  tooth_chart: string | null;
  notes: string | null;
};

export type TreatmentPlan = {
  id: string;
  patient_id: string;
  plan_text: string;
  clinician_name: string | null;
  clinician_signature: string | null;
  clinician_date: string | null;
  supervisor_name: string | null;
  supervisor_signature: string | null;
  supervisor_date: string | null;
  created_at: string;
};

export type TreatmentRecord = {
  id: string;
  patient_id: string;
  treatment_date: string;
  tooth_number: string | null;
  procedure: string;
  clinician: string | null;
  clinical_supervisor: string | null;
  created_at: string;
};

export type PatientBundle = {
  patient: Patient;
  medicalHistory: MedicalHistory | null;
  dentalHistory: DentalHistory | null;
  intraoralExam: IntraoralExamination | null;
  treatmentPlans: TreatmentPlan[];
  treatmentRecords: TreatmentRecord[];
};

export type AppSettings = {
  shell_title: string;
  shell_subtitle: string;
  clinic_name: string;
  add_patient_label: string;
  dashboard_title: string;
  dashboard_ledger_title: string;
  dashboard_description: string;
  updated_at: string;
};

export type Practitioner = {
  id: string;
  display_name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};
