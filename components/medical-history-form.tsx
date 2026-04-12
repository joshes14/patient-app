"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { MedicalHistory } from "@/lib/types";

type MedicalHistoryFormProps = {
  patientId: string;
  initialData: MedicalHistory | null;
  formId?: string;
  hideIntroCard?: boolean;
  isEditable?: boolean;
  showSubmitButton?: boolean;
  onSavedHref?: string;
};

type MedicalState = {
  physician_name: string;
  physician_office_number: string;
  physician_office_address: string;

  in_good_health: boolean;
  under_medical_treatment: boolean;
  condition_being_treated: string;
  hospitalized: boolean;
  hospitalization_reason: string;
  taking_medication: boolean;
  medication_details: string;
  uses_tobacco: boolean;
  uses_drugs: boolean;
  drug_details: string;

  allergic_local_anesthetic: boolean;
  allergic_penicillin: boolean;
  allergic_aspirin: boolean;
  allergic_latex: boolean;
  allergic_others: string;

  is_pregnant: boolean;
  is_nursing: boolean;
  taking_birth_control: boolean;

  blood_type: string;
  blood_pressure: string;
  pulse_rate: string;
  respiratory_rate: string;
  body_temperature: string;
  height: string;
  weight_vitals: string;

  /* Q12 checklist fields */
  has_high_blood_pressure: boolean;
  has_low_blood_pressure: boolean;
  has_epilepsy: boolean;
  has_aids_hiv: boolean;
  has_std: boolean;
  has_stomach_troubles: boolean;
  has_fainting_seizures: boolean;
  has_rapid_weight_loss: boolean;
  has_radiation_therapy: boolean;
  has_joint_replacement: boolean;
  has_diabetes: boolean;
  has_heart_surgery: boolean;
  has_heart_disease: boolean;
  has_heart_murmur: boolean;
  has_hepatitis_liver: boolean;
  has_rheumatic_fever: boolean;
  has_hay_fever: boolean;
  has_respiratory_problems: boolean;
  has_hepatitis_jaundice: boolean;
  has_tuberculosis: boolean;
  has_swollen_ankles: boolean;
  has_kidney_disease: boolean;
  has_chest_pain: boolean;
  has_heart_attack: boolean;
  has_cancer_tumors: boolean;
  has_anemia: boolean;
  has_angina: boolean;
  has_asthma: boolean;
  has_emphysema: boolean;
  has_bleeding_problems: boolean;
  has_blood_diseases: boolean;
  has_head_injuries: boolean;
  has_arthritis: boolean;
  has_thyroid_problem: boolean;
  has_stroke: boolean;
  has_others: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] sm:p-6";

const panelClass = "rounded-xl border border-[#c4c7c3]/35 bg-[#fafaf5] p-4 sm:p-5";

export default function MedicalHistoryForm({
  patientId,
  initialData,
  formId,
  hideIntroCard = false,
  isEditable = true,
  showSubmitButton = true,
  onSavedHref,
}: MedicalHistoryFormProps) {
  const router = useRouter();
  const [state, setState] = useState<MedicalState>({
    physician_name: initialData?.physician_name ?? "",
    physician_office_number: initialData?.physician_office_number ?? "",
    physician_office_address: initialData?.physician_office_address ?? "",

    in_good_health: Boolean(initialData?.in_good_health),
    under_medical_treatment: Boolean(initialData?.under_medical_treatment),
    condition_being_treated: initialData?.condition_being_treated ?? "",
    hospitalized: Boolean(initialData?.hospitalized),
    hospitalization_reason: initialData?.hospitalization_reason ?? "",
    taking_medication: Boolean(initialData?.taking_medication),
    medication_details: initialData?.medication_details ?? "",
    uses_tobacco: Boolean(initialData?.uses_tobacco),
    uses_drugs: Boolean(initialData?.uses_drugs),
    drug_details: initialData?.drug_details ?? "",

    allergic_local_anesthetic: Boolean(initialData?.allergic_local_anesthetic),
    allergic_penicillin: Boolean(initialData?.allergic_penicillin),
    allergic_aspirin: Boolean(initialData?.allergic_aspirin),
    allergic_latex: Boolean(initialData?.allergic_latex),
    allergic_others: initialData?.allergic_others ?? "",

    is_pregnant: Boolean(initialData?.is_pregnant),
    is_nursing: Boolean(initialData?.is_nursing),
    taking_birth_control: Boolean(initialData?.taking_birth_control),

    blood_type: initialData?.blood_type ?? "",
    blood_pressure: initialData?.blood_pressure ?? "",
    pulse_rate: initialData?.pulse_rate ?? "",
    respiratory_rate: initialData?.respiratory_rate ?? "",
    body_temperature: initialData?.body_temperature ?? "",
    height: initialData?.height ?? "",
    weight_vitals: initialData?.weight_vitals ?? "",

    has_high_blood_pressure: Boolean(initialData?.has_high_blood_pressure),
    has_low_blood_pressure: Boolean(initialData?.has_low_blood_pressure),
    has_epilepsy: Boolean(initialData?.has_epilepsy),
    has_aids_hiv: Boolean(initialData?.has_aids_hiv),
    has_std: Boolean(initialData?.has_std),
    has_stomach_troubles: Boolean(initialData?.has_stomach_troubles),
    has_fainting_seizures: Boolean(initialData?.has_fainting_seizures),
    has_rapid_weight_loss: Boolean(initialData?.has_rapid_weight_loss),
    has_radiation_therapy: Boolean(initialData?.has_radiation_therapy),
    has_joint_replacement: Boolean(initialData?.has_joint_replacement),
    has_diabetes: Boolean(initialData?.has_diabetes),
    has_heart_surgery: Boolean(initialData?.has_heart_surgery),
    has_heart_disease: Boolean(initialData?.has_heart_disease),
    has_heart_murmur: Boolean(initialData?.has_heart_murmur),
    has_hepatitis_liver: Boolean(initialData?.has_hepatitis_liver),
    has_rheumatic_fever: Boolean(initialData?.has_rheumatic_fever),
    has_hay_fever: Boolean(initialData?.has_hay_fever),
    has_respiratory_problems: Boolean(initialData?.has_respiratory_problems),
    has_hepatitis_jaundice: Boolean(initialData?.has_hepatitis_jaundice),
    has_tuberculosis: Boolean(initialData?.has_tuberculosis),
    has_swollen_ankles: Boolean(initialData?.has_swollen_ankles),
    has_kidney_disease: Boolean(initialData?.has_kidney_disease),
    has_chest_pain: Boolean(initialData?.has_chest_pain),
    has_heart_attack: Boolean(initialData?.has_heart_attack),
    has_cancer_tumors: Boolean(initialData?.has_cancer_tumors),
    has_anemia: Boolean(initialData?.has_anemia),
    has_angina: Boolean(initialData?.has_angina),
    has_asthma: Boolean(initialData?.has_asthma),
    has_emphysema: Boolean(initialData?.has_emphysema),
    has_bleeding_problems: Boolean(initialData?.has_bleeding_problems),
    has_blood_diseases: Boolean(initialData?.has_blood_diseases),
    has_head_injuries: Boolean(initialData?.has_head_injuries),
    has_arthritis: Boolean(initialData?.has_arthritis),
    has_thyroid_problem: Boolean(initialData?.has_thyroid_problem),
    has_stroke: Boolean(initialData?.has_stroke),
    has_others: initialData?.has_others ?? "",
    notes: initialData?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);

  const setField = (field: keyof MedicalState, value: string | boolean) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEditable || isPending) {
      return;
    }

    setError("");
    setSuccess("");
    setIsPending(true);

    const response = await fetch(`/api/patients/${patientId}/medical`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

    setIsPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error ?? "Unable to save medical history.");
      return;
    }

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setSuccess("Medical history saved.");
    router.refresh();
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="patient-grid-morph grid gap-4 lg:grid-cols-6"
    >
      <fieldset disabled={!isEditable || isPending} className="contents">
        {hideIntroCard ? null : (
          <section className={`${cardClass} lg:col-span-6`}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Health Intake</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#181e1a]">Medical History</h2>
            <p className="mt-1 text-sm text-[#4f564f]">Medical history of the patient.</p>
          </section>
        )}

      <section className={`${cardClass} lg:col-span-3`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Physician</p>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Physician name</label>
              <input
                className={inputClass}
                value={state.physician_name}
                onChange={(event) => setField("physician_name", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Physician office number</label>
              <input
                className={inputClass}
                value={state.physician_office_number}
                onChange={(event) => setField("physician_office_number", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Physician office address</label>
              <textarea
                rows={3}
                className={inputClass}
                value={state.physician_office_address}
                onChange={(event) => setField("physician_office_address", event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-3`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">General Health</p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.in_good_health}
                onChange={(event) => setField("in_good_health", event.target.checked)}
              />
              Are you in good health?
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.under_medical_treatment}
                onChange={(event) => setField("under_medical_treatment", event.target.checked)}
              />
              Are you in medical treatment now?
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.hospitalized}
                onChange={(event) => setField("hospitalized", event.target.checked)}
              />
              Ever been hospitalized for serious illness/surgery?
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.taking_medication}
                onChange={(event) => setField("taking_medication", event.target.checked)}
              />
              Taking any prescription/non-prescription medication?
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.uses_tobacco}
                onChange={(event) => setField("uses_tobacco", event.target.checked)}
              />
              Use tobacco products?
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.uses_drugs}
                onChange={(event) => setField("uses_drugs", event.target.checked)}
              />
              Use alcohol, cocaine, or dangerous drugs?
            </label>
          </div>

          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Condition being treated</label>
              <textarea
                rows={2}
                className={inputClass}
                value={state.condition_being_treated}
                onChange={(event) => setField("condition_being_treated", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Hospitalization details</label>
              <textarea
                rows={2}
                className={inputClass}
                value={state.hospitalization_reason}
                onChange={(event) => setField("hospitalization_reason", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Medication details</label>
              <textarea
                rows={2}
                className={inputClass}
                value={state.medication_details}
                onChange={(event) => setField("medication_details", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Drug details</label>
              <textarea
                rows={2}
                className={inputClass}
                value={state.drug_details}
                onChange={(event) => setField("drug_details", event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-4`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Vitals</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Blood type</label>
              <input className={inputClass} value={state.blood_type} onChange={(event) => setField("blood_type", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Blood pressure</label>
              <input className={inputClass} value={state.blood_pressure} onChange={(event) => setField("blood_pressure", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Pulse rate</label>
              <input className={inputClass} value={state.pulse_rate} onChange={(event) => setField("pulse_rate", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Respiratory rate</label>
              <input className={inputClass} value={state.respiratory_rate} onChange={(event) => setField("respiratory_rate", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Body temperature</label>
              <input className={inputClass} value={state.body_temperature} onChange={(event) => setField("body_temperature", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Height</label>
              <input className={inputClass} value={state.height} onChange={(event) => setField("height", event.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Weight</label>
              <input className={inputClass} value={state.weight_vitals} onChange={(event) => setField("weight_vitals", event.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-2`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">For Women</p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.is_pregnant} onChange={(event) => setField("is_pregnant", event.target.checked)} />
              Pregnant
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.is_nursing} onChange={(event) => setField("is_nursing", event.target.checked)} />
              Nursing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.taking_birth_control}
                onChange={(event) => setField("taking_birth_control", event.target.checked)}
              />
              Taking birth control
            </label>
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-6`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Allergies</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.allergic_local_anesthetic} onChange={(event) => setField("allergic_local_anesthetic", event.target.checked)} /> Local Anesthetic (Lidocaine)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.allergic_penicillin} onChange={(event) => setField("allergic_penicillin", event.target.checked)} /> Penicillin Antibiotics</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.allergic_aspirin} onChange={(event) => setField("allergic_aspirin", event.target.checked)} /> Aspirin</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.allergic_latex} onChange={(event) => setField("allergic_latex", event.target.checked)} /> Latex</label>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">Other allergy details</label>
            <input className={inputClass} value={state.allergic_others} onChange={(event) => setField("allergic_others", event.target.value)} />
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-6`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Medical Conditions Checklist</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_high_blood_pressure} onChange={(event)=>setField("has_high_blood_pressure", event.target.checked)} /> High Blood Pressure</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_low_blood_pressure} onChange={(event)=>setField("has_low_blood_pressure", event.target.checked)} /> Low Blood Pressure</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_epilepsy} onChange={(event)=>setField("has_epilepsy", event.target.checked)} /> Epilepsy/Convulsions</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_aids_hiv} onChange={(event)=>setField("has_aids_hiv", event.target.checked)} /> AIDS or HIV Infection</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_std} onChange={(event)=>setField("has_std", event.target.checked)} /> Sexually Transmitted</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_stomach_troubles} onChange={(event)=>setField("has_stomach_troubles", event.target.checked)} /> Stomach Troubles</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_fainting_seizures} onChange={(event)=>setField("has_fainting_seizures", event.target.checked)} /> Fainting Seizures</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_rapid_weight_loss} onChange={(event)=>setField("has_rapid_weight_loss", event.target.checked)} /> Rapid Weight Loss</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_radiation_therapy} onChange={(event)=>setField("has_radiation_therapy", event.target.checked)} /> Radiation Therapy</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_joint_replacement} onChange={(event)=>setField("has_joint_replacement", event.target.checked)} /> Joint Replacement</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_diabetes} onChange={(event)=>setField("has_diabetes", event.target.checked)} /> Diabetes</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_heart_surgery} onChange={(event)=>setField("has_heart_surgery", event.target.checked)} /> Heart Surgery</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_heart_disease} onChange={(event)=>setField("has_heart_disease", event.target.checked)} /> Heart Disease</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_heart_murmur} onChange={(event)=>setField("has_heart_murmur", event.target.checked)} /> Heart Murmur</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_hepatitis_liver} onChange={(event)=>setField("has_hepatitis_liver", event.target.checked)} /> Hepatitis / Liver Disease</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_rheumatic_fever} onChange={(event)=>setField("has_rheumatic_fever", event.target.checked)} /> Rheumatic Fever</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_hay_fever} onChange={(event)=>setField("has_hay_fever", event.target.checked)} /> Hay Fever / Allergies</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_respiratory_problems} onChange={(event)=>setField("has_respiratory_problems", event.target.checked)} /> Respiratory Problems</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_hepatitis_jaundice} onChange={(event)=>setField("has_hepatitis_jaundice", event.target.checked)} /> Hepatitis / Jaundice</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_tuberculosis} onChange={(event)=>setField("has_tuberculosis", event.target.checked)} /> Tuberculosis</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_swollen_ankles} onChange={(event)=>setField("has_swollen_ankles", event.target.checked)} /> Swollen Ankles</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_kidney_disease} onChange={(event)=>setField("has_kidney_disease", event.target.checked)} /> Kidney Disease</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_chest_pain} onChange={(event)=>setField("has_chest_pain", event.target.checked)} /> Chest Pain</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_heart_attack} onChange={(event)=>setField("has_heart_attack", event.target.checked)} /> Heart Attack</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_cancer_tumors} onChange={(event)=>setField("has_cancer_tumors", event.target.checked)} /> Cancer / Tumors</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_anemia} onChange={(event)=>setField("has_anemia", event.target.checked)} /> Anemia</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_angina} onChange={(event)=>setField("has_angina", event.target.checked)} /> Angina</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_asthma} onChange={(event)=>setField("has_asthma", event.target.checked)} /> Asthma</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_emphysema} onChange={(event)=>setField("has_emphysema", event.target.checked)} /> Emphysema</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_bleeding_problems} onChange={(event)=>setField("has_bleeding_problems", event.target.checked)} /> Bleeding Problems</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_blood_diseases} onChange={(event)=>setField("has_blood_diseases", event.target.checked)} /> Blood Diseases</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_head_injuries} onChange={(event)=>setField("has_head_injuries", event.target.checked)} /> Head Injuries</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_arthritis} onChange={(event)=>setField("has_arthritis", event.target.checked)} /> Arthritis / Rheumatism</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_thyroid_problem} onChange={(event)=>setField("has_thyroid_problem", event.target.checked)} /> Thyroid Problem</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.has_stroke} onChange={(event)=>setField("has_stroke", event.target.checked)} /> Stroke</label>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">Others</label>
            <input className={inputClass} value={state.has_others} onChange={(event)=>setField("has_others", event.target.value)} />
          </div>
        </div>
      </section>

      <section className={`${cardClass} lg:col-span-6`}>
        <div className={panelClass}>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Notes</p>
          <label className="mb-1 block text-sm font-medium">Additional notes</label>
          <textarea
            rows={4}
            className={inputClass}
            value={state.notes}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </div>
      </section>

      </fieldset>

      {error || success || showSubmitButton ? (
        <section className={`${cardClass} lg:col-span-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
              {success ? <p className="text-sm text-[#444844]">{success}</p> : null}
            </div>

            {showSubmitButton ? (
              <button
                type="submit"
                disabled={!isEditable || isPending}
                className="rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#424844] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Saving..." : "Save Medical History"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </form>
  );
}
