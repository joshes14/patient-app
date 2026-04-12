"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Save, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Patient } from "@/lib/types";
import { patientPayloadSchema } from "@/lib/validators";
import type { z } from "zod";

type PatientFormValues = z.infer<typeof patientPayloadSchema>;

type PatientFormProps = {
  mode: "create" | "edit";
  patientId?: string;
  initialValues?: Partial<Patient>;
  variant?: "page" | "modal";
  onCancel?: () => void;
  onSuccess?: (patient: Patient) => void;
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const fieldClassName =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:bg-[#ffffff] focus:outline-none focus:ring-0";

const labelClassName = "mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]";
const sectionClassName = "rounded-2xl border border-[#c4c7c3]/35 bg-[#fafaf5]/85 p-4 sm:p-5";

export default function PatientForm({
  mode,
  patientId,
  initialValues,
  variant = "page",
  onCancel,
  onSuccess,
}: PatientFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const isModal = variant === "modal";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientPayloadSchema),
    defaultValues: {
      last_name: initialValues?.last_name ?? "",
      first_name: initialValues?.first_name ?? "",
      middle_name: initialValues?.middle_name ?? "",
      date_of_birth: initialValues?.date_of_birth ?? "",
      age: initialValues?.age ?? null,
      sex: initialValues?.sex ?? "",
      home_address: initialValues?.home_address ?? "",
      home_telephone: initialValues?.home_telephone ?? "",
      cellphone: initialValues?.cellphone ?? "",
      medical_alert: initialValues?.medical_alert ?? "",
      emergency_contact_name: initialValues?.emergency_contact_name ?? "",
      emergency_contact_telephone: initialValues?.emergency_contact_telephone ?? "",
      emergency_contact_address: initialValues?.emergency_contact_address ?? "",
      relationship_to_patient: initialValues?.relationship_to_patient ?? "",
      civil_status: initialValues?.civil_status ?? "",
      religion: initialValues?.religion ?? "",
      occupation: initialValues?.occupation ?? "",
      nationality: initialValues?.nationality ?? "",
      height: initialValues?.height ?? "",
      weight: initialValues?.weight ?? "",
      chief_complaint: initialValues?.chief_complaint ?? "",
      history_of_present_illness: initialValues?.history_of_present_illness ?? "",
      review_status: initialValues?.review_status === "archived" ? "archived" : "active",
    },
  });

  const onSubmit = async (values: PatientFormValues) => {
    setApiError("");
    setApiSuccess("");

    const payload: PatientFormValues = {
      ...values,
      middle_name: toNullable(values.middle_name ?? ""),
      date_of_birth: toNullable(values.date_of_birth ?? ""),
      sex: toNullable(values.sex ?? ""),
      home_address: toNullable(values.home_address ?? ""),
      home_telephone: toNullable(values.home_telephone ?? ""),
      cellphone: toNullable(values.cellphone ?? ""),
      medical_alert: toNullable(values.medical_alert ?? ""),
      emergency_contact_name: toNullable(values.emergency_contact_name ?? ""),
      emergency_contact_telephone: toNullable(values.emergency_contact_telephone ?? ""),
      emergency_contact_address: toNullable(values.emergency_contact_address ?? ""),
      relationship_to_patient: toNullable(values.relationship_to_patient ?? ""),
      civil_status: toNullable(values.civil_status ?? ""),
      religion: toNullable(values.religion ?? ""),
      occupation: toNullable(values.occupation ?? ""),
      nationality: toNullable(values.nationality ?? ""),
      height: toNullable(values.height ?? ""),
      weight: toNullable(values.weight ?? ""),
      chief_complaint: toNullable(values.chief_complaint ?? ""),
      history_of_present_illness: toNullable(values.history_of_present_illness ?? ""),
      review_status: values.review_status === "archived" ? "archived" : "active",
    };

    const isEdit = mode === "edit";
    const endpoint = isEdit ? `/api/patients/${patientId}` : "/api/patients";
    const method = isEdit ? "PUT" : "POST";

    if (isEdit && !patientId) {
      setApiError("Missing patient ID.");
      return;
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setApiError(result?.error ?? "Unable to save patient details.");
      return;
    }

    const result = (await response.json()) as { patient: Patient };

    if (mode === "create") {
      if (onSuccess) {
        onSuccess(result.patient);
        return;
      }

      router.push(`/patients/${result.patient.id}`);
      router.refresh();
      return;
    }

    setApiSuccess("Patient details updated.");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={
        isModal
          ? "space-y-5"
          : "space-y-5 rounded-[28px] border border-[#c4c7c3]/30 bg-white/90 p-5 shadow-[0_24px_48px_-28px_rgba(26,28,25,0.45)] backdrop-blur-sm sm:p-7"
      }
    >
      <div className={`flex items-start justify-between gap-4 ${isModal ? "" : "border-b border-[#c4c7c3]/30 pb-5"}`}>
        <div>
          <h2 className="text-xl font-semibold text-[#181e1a] sm:text-2xl">
            {mode === "create" ? "Create Patient Profile" : "Edit Patient Profile"}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#626961]">
            {mode === "create" ? "Intake registration" : "Update intake details"}
          </p>
        </div>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c4c7c3]/35 bg-[#f4f4ef] text-[#2d332f]">
          {mode === "create" ? <UserPlus className="h-5 w-5" strokeWidth={1.8} /> : <Save className="h-5 w-5" strokeWidth={1.8} />}
        </span>
      </div>

      {mode === "edit" ? (
        <p className="text-sm leading-relaxed text-[#535b53]">
          Update only the fields you need, then save changes to refresh this patient profile.
        </p>
      ) : null}

      <section className={sectionClassName}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7c847a]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2d332f]">Identity & Alerts</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClassName}>Medical Alert</label>
            <textarea rows={2} className={`${fieldClassName} resize-y`} {...register("medical_alert")} />
          </div>

          <div>
            <label className={labelClassName}>Last Name</label>
            <input className={fieldClassName} {...register("last_name")} />
            {errors.last_name ? <p className="mt-1 text-xs text-[#ba1a1a]">{errors.last_name.message}</p> : null}
          </div>

          <div>
            <label className={labelClassName}>First Name</label>
            <input className={fieldClassName} {...register("first_name")} />
            {errors.first_name ? <p className="mt-1 text-xs text-[#ba1a1a]">{errors.first_name.message}</p> : null}
          </div>

          <div>
            <label className={labelClassName}>Middle Name</label>
            <input className={fieldClassName} {...register("middle_name")} />
          </div>

          <div>
            <label className={labelClassName}>Date of Birth</label>
            <input type="date" className={fieldClassName} {...register("date_of_birth")} />
          </div>

          <div>
            <label className={labelClassName}>Age</label>
            <input
              type="number"
              className={fieldClassName}
              {...register("age", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </div>

          <div>
            <label className={labelClassName}>Sex</label>
            <select className={fieldClassName} {...register("sex")}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7c847a]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2d332f]">Profile Details</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClassName}>Civil Status</label>
            <select className={fieldClassName} {...register("civil_status")}>
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Religion</label>
            <input className={fieldClassName} {...register("religion")} />
          </div>

          <div>
            <label className={labelClassName}>Occupation</label>
            <input className={fieldClassName} {...register("occupation")} />
          </div>

          <div>
            <label className={labelClassName}>Nationality</label>
            <input className={fieldClassName} {...register("nationality")} />
          </div>

          <div>
            <label className={labelClassName}>Height</label>
            <input className={fieldClassName} {...register("height")} />
          </div>

          <div>
            <label className={labelClassName}>Weight</label>
            <input className={fieldClassName} {...register("weight")} />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7c847a]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2d332f]">Contact</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Home Telephone</label>
            <input className={fieldClassName} {...register("home_telephone")} />
          </div>

          <div>
            <label className={labelClassName}>Cellphone</label>
            <input className={fieldClassName} {...register("cellphone")} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClassName}>Home Address</label>
            <textarea rows={2} className={`${fieldClassName} resize-y`} {...register("home_address")} />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7c847a]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2d332f]">Emergency Contact</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Emergency Contact Name</label>
            <input className={fieldClassName} {...register("emergency_contact_name")} />
          </div>

          <div>
            <label className={labelClassName}>Emergency Telephone</label>
            <input className={fieldClassName} {...register("emergency_contact_telephone")} />
          </div>

          <div>
            <label className={labelClassName}>Relationship to Patient</label>
            <input className={fieldClassName} {...register("relationship_to_patient")} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClassName}>Emergency Address</label>
            <textarea rows={2} className={`${fieldClassName} resize-y`} {...register("emergency_contact_address")} />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7c847a]" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2d332f]">Clinical Notes</h3>
        </div>

        <div className="grid gap-4">
          <div>
            <label className={labelClassName}>Chief Complaint</label>
            <textarea rows={2} className={`${fieldClassName} resize-y`} {...register("chief_complaint")} />
          </div>

          <div>
            <label className={labelClassName}>History of Present Illness</label>
            <textarea rows={3} className={`${fieldClassName} resize-y`} {...register("history_of_present_illness")} />
          </div>
        </div>
      </section>

      {apiError ? (
        <div className="flex items-start gap-2 rounded-2xl border border-[#ba1a1a]/20 bg-[#fdeceb] px-3 py-2.5 text-sm text-[#7b1113]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
          <p>{apiError}</p>
        </div>
      ) : null}

      {apiSuccess ? (
        <div className="rounded-2xl border border-[#7c847a]/25 bg-[#eff4ef] px-3 py-2.5 text-sm text-[#2f4b35]">{apiSuccess}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#c4c7c3]/30 pt-4">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#c4c7c3]/50 bg-[#f7f7f2] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-[#2d332f] transition-colors hover:bg-[#efefe8]"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#2d332f] px-6 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Patient" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
