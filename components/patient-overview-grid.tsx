"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PatientReviewStatusControls from "@/components/patient-review-status-controls";
import type { Patient } from "@/lib/types";

type ChartProgressItem = {
  label: string;
  complete: boolean;
};

type PatientOverviewGridProps = {
  patient: Patient;
  isEditing: boolean;
  chartProgress: ChartProgressItem[];
  treatmentPlansCount: number;
  treatmentRecordsCount: number;
  formId?: string;
  onSavedHref?: string;
};

type OverviewFormState = {
  last_name: string;
  first_name: string;
  middle_name: string;
  date_of_birth: string;
  age: string;
  sex: string;
  civil_status: string;
  religion: string;
  occupation: string;
  nationality: string;
  height: string;
  weight: string;
  home_address: string;
  home_telephone: string;
  cellphone: string;
  medical_alert: string;
  emergency_contact_name: string;
  emergency_contact_telephone: string;
  emergency_contact_address: string;
  relationship_to_patient: string;
  chief_complaint: string;
  history_of_present_illness: string;
};

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] lg:p-6";

const panelClass = "rounded-xl bg-[#f6f7f2] px-4 py-3";

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const labelClass = "mb-1 block text-[10px] uppercase tracking-[0.16em] text-[#6b726b]";

const toReadable = (value?: string | null): string => {
  if (!value || value.trim().length === 0) {
    return "Not recorded";
  }

  return value;
};

const toSexLabel = (value?: string | null): string => {
  if (!value) {
    return "Not specified";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const toDateLabel = (value?: string | null): string => {
  if (!value) {
    return "No date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const toInitialState = (patient: Patient): OverviewFormState => ({
  last_name: patient.last_name,
  first_name: patient.first_name,
  middle_name: patient.middle_name ?? "",
  date_of_birth: patient.date_of_birth ?? "",
  age: patient.age !== null ? String(patient.age) : "",
  sex: patient.sex ?? "",
  civil_status: patient.civil_status ?? "",
  religion: patient.religion ?? "",
  occupation: patient.occupation ?? "",
  nationality: patient.nationality ?? "",
  height: patient.height ?? "",
  weight: patient.weight ?? "",
  home_address: patient.home_address ?? "",
  home_telephone: patient.home_telephone ?? "",
  cellphone: patient.cellphone ?? "",
  medical_alert: patient.medical_alert ?? "",
  emergency_contact_name: patient.emergency_contact_name ?? "",
  emergency_contact_telephone: patient.emergency_contact_telephone ?? "",
  emergency_contact_address: patient.emergency_contact_address ?? "",
  relationship_to_patient: patient.relationship_to_patient ?? "",
  chief_complaint: patient.chief_complaint ?? "",
  history_of_present_illness: patient.history_of_present_illness ?? "",
});

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export default function PatientOverviewGrid({
  patient,
  isEditing,
  chartProgress,
  treatmentPlansCount,
  treatmentRecordsCount,
  formId,
  onSavedHref,
}: PatientOverviewGridProps) {
  const router = useRouter();
  const [state, setState] = useState<OverviewFormState>(() => toInitialState(patient));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setState(toInitialState(patient));
    setError("");
    setSuccess("");
  }, [patient]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEditing || isPending) {
      return;
    }

    const firstName = state.first_name.trim();
    const lastName = state.last_name.trim();
    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      setSuccess("");
      return;
    }

    const ageValue = state.age.trim();
    let age: number | null = null;
    if (ageValue.length > 0) {
      const parsedAge = Number(ageValue);
      if (!Number.isFinite(parsedAge) || parsedAge < 0) {
        setError("Age must be a non-negative number.");
        setSuccess("");
        return;
      }

      age = Math.floor(parsedAge);
    }

    setError("");
    setSuccess("");
    setIsPending(true);

    const response = await fetch(`/api/patients/${patient.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_name: lastName,
        first_name: firstName,
        middle_name: toNullable(state.middle_name),
        date_of_birth: toNullable(state.date_of_birth),
        age,
        sex: toNullable(state.sex),
        civil_status: toNullable(state.civil_status),
        religion: toNullable(state.religion),
        occupation: toNullable(state.occupation),
        nationality: toNullable(state.nationality),
        height: toNullable(state.height),
        weight: toNullable(state.weight),
        home_address: toNullable(state.home_address),
        home_telephone: toNullable(state.home_telephone),
        cellphone: toNullable(state.cellphone),
        medical_alert: toNullable(state.medical_alert),
        emergency_contact_name: toNullable(state.emergency_contact_name),
        emergency_contact_telephone: toNullable(state.emergency_contact_telephone),
        emergency_contact_address: toNullable(state.emergency_contact_address),
        relationship_to_patient: toNullable(state.relationship_to_patient),
        chief_complaint: toNullable(state.chief_complaint),
        history_of_present_illness: toNullable(state.history_of_present_illness),
        review_status: patient.review_status === "archived" ? "archived" : "active",
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to save patient overview.");
      return;
    }

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setSuccess("Patient overview saved.");
    router.refresh();
  };

  const contactLabel = patient.cellphone ?? patient.home_telephone ?? "No contact info";

  return (
    <form id={formId} onSubmit={handleSubmit} className="patient-grid-morph mb-6 grid gap-4 lg:grid-cols-12">
      <fieldset disabled={!isEditing || isPending} className="contents">
        <article className={`${cardClass} lg:col-span-7`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Patient Snapshot</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className={panelClass}>
              <p className={labelClass}>Last Name</p>
              {isEditing ? (
                <input
                  value={state.last_name}
                  onChange={(event) => setState((prev) => ({ ...prev, last_name: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.last_name)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>First Name</p>
              {isEditing ? (
                <input
                  value={state.first_name}
                  onChange={(event) => setState((prev) => ({ ...prev, first_name: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.first_name)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Middle Name</p>
              {isEditing ? (
                <input
                  value={state.middle_name}
                  onChange={(event) => setState((prev) => ({ ...prev, middle_name: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.middle_name)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Date of Birth</p>
              {isEditing ? (
                <input
                  type="date"
                  value={state.date_of_birth}
                  onChange={(event) => setState((prev) => ({ ...prev, date_of_birth: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toDateLabel(patient.date_of_birth)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Age</p>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  value={state.age}
                  onChange={(event) => setState((prev) => ({ ...prev, age: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{patient.age !== null ? `${patient.age} years old` : "Not recorded"}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Sex</p>
              {isEditing ? (
                <select
                  value={state.sex}
                  onChange={(event) => setState((prev) => ({ ...prev, sex: event.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toSexLabel(patient.sex)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Civil Status</p>
              {isEditing ? (
                <select
                  value={state.civil_status}
                  onChange={(event) => setState((prev) => ({ ...prev, civil_status: event.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.civil_status)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Religion</p>
              {isEditing ? (
                <input
                  value={state.religion}
                  onChange={(event) => setState((prev) => ({ ...prev, religion: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.religion)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Occupation</p>
              {isEditing ? (
                <input
                  value={state.occupation}
                  onChange={(event) => setState((prev) => ({ ...prev, occupation: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.occupation)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Nationality</p>
              {isEditing ? (
                <input
                  value={state.nationality}
                  onChange={(event) => setState((prev) => ({ ...prev, nationality: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.nationality)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Height</p>
              {isEditing ? (
                <input
                  value={state.height}
                  onChange={(event) => setState((prev) => ({ ...prev, height: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.height)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Weight</p>
              {isEditing ? (
                <input
                  value={state.weight}
                  onChange={(event) => setState((prev) => ({ ...prev, weight: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.weight)}</p>
              )}
            </div>
          </div>
        </article>

        <article className={`${cardClass} lg:col-span-5`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Contact Details</p>

          <div className="mt-4 space-y-3">
            <div className={panelClass}>
              <p className={labelClass}>Cellphone</p>
              {isEditing ? (
                <input
                  value={state.cellphone}
                  onChange={(event) => setState((prev) => ({ ...prev, cellphone: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.cellphone ?? contactLabel)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Home Telephone</p>
              {isEditing ? (
                <input
                  value={state.home_telephone}
                  onChange={(event) => setState((prev) => ({ ...prev, home_telephone: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm text-[#1e251f]">{toReadable(patient.home_telephone)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Home Address</p>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={state.home_address}
                  onChange={(event) => setState((prev) => ({ ...prev, home_address: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-[#1e251f]">{toReadable(patient.home_address)}</p>
              )}
            </div>
          </div>
        </article>

        <article className={`${cardClass} lg:col-span-5`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Emergency Contact</p>

          <div className="mt-4 space-y-3 text-sm text-[#1e251f]">
            <div className={panelClass}>
              <p className={labelClass}>Name</p>
              {isEditing ? (
                <input
                  value={state.emergency_contact_name}
                  onChange={(event) => setState((prev) => ({ ...prev, emergency_contact_name: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1">{toReadable(patient.emergency_contact_name)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Relationship</p>
              {isEditing ? (
                <input
                  value={state.relationship_to_patient}
                  onChange={(event) => setState((prev) => ({ ...prev, relationship_to_patient: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1">{toReadable(patient.relationship_to_patient)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Telephone</p>
              {isEditing ? (
                <input
                  value={state.emergency_contact_telephone}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, emergency_contact_telephone: event.target.value }))
                  }
                  className={inputClass}
                />
              ) : (
                <p className="mt-1">{toReadable(patient.emergency_contact_telephone)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Address</p>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={state.emergency_contact_address}
                  onChange={(event) => setState((prev) => ({ ...prev, emergency_contact_address: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1">{toReadable(patient.emergency_contact_address)}</p>
              )}
            </div>
          </div>
        </article>

        <article className={`${cardClass} lg:col-span-7`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Clinical Notes</p>

          <div className="mt-4 space-y-3">
            <div className={panelClass}>
              <p className={labelClass}>Medical Alert</p>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={state.medical_alert}
                  onChange={(event) => setState((prev) => ({ ...prev, medical_alert: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-[#1e251f]">{toReadable(patient.medical_alert)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>Chief Complaint</p>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={state.chief_complaint}
                  onChange={(event) => setState((prev) => ({ ...prev, chief_complaint: event.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-[#1e251f]">{toReadable(patient.chief_complaint)}</p>
              )}
            </div>

            <div className={panelClass}>
              <p className={labelClass}>History of Present Illness</p>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={state.history_of_present_illness}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, history_of_present_illness: event.target.value }))
                  }
                  className={inputClass}
                />
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-[#1e251f]">{toReadable(patient.history_of_present_illness)}</p>
              )}
            </div>
          </div>
        </article>
      </fieldset>

      <article className={`${cardClass} lg:col-span-8`}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Chart Progress</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chartProgress.map((item) => (
            <div key={item.label} className={panelClass}>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b726b]">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-[#1e251f]">{item.complete ? "Updated" : "Not yet recorded"}</p>
            </div>
          ))}
        </div>
      </article>

      <article className={`${cardClass} lg:col-span-4`}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Treatment Summary</p>

        <div className="mt-4 space-y-3">
          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b726b]">Record State</p>
            <div className="mt-2">
              <PatientReviewStatusControls patientId={patient.id} reviewStatus={patient.review_status} />
            </div>
          </div>

          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b726b]">Plans</p>
            <p className="mt-1 text-lg font-semibold text-[#1e251f]">{treatmentPlansCount}</p>
          </div>

          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b726b]">Records</p>
            <p className="mt-1 text-lg font-semibold text-[#1e251f]">{treatmentRecordsCount}</p>
          </div>

          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6b726b]">Last Updated</p>
            <p className="mt-1 text-sm text-[#1e251f]">{toDateLabel(patient.updated_at)}</p>
          </div>
        </div>
      </article>

      {error || success ? (
        <article className={`${cardClass} lg:col-span-12`}>
          {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
          {success ? <p className="text-sm text-[#2f4b35]">{success}</p> : null}
        </article>
      ) : null}
    </form>
  );
}
