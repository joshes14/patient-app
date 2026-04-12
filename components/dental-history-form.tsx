"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DentalHistory } from "@/lib/types";

type DentalHistoryFormProps = {
  patientId: string;
  initialData: DentalHistory | null;
  formId?: string;
  hideIntroCard?: boolean;
  isEditable?: boolean;
  showSubmitButton?: boolean;
  onSavedHref?: string;
};

type DentalState = {
  frequency_of_dental_visit: string;
  date_of_last_dental_visit: string;
  procedures_done_on_last_visit: string;
  exposure_to_local_anesthesia: string;
  complications_during_after_procedure: string;
};

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] sm:p-6";

export default function DentalHistoryForm({
  patientId,
  initialData,
  formId,
  hideIntroCard = false,
  isEditable = true,
  showSubmitButton = true,
  onSavedHref,
}: DentalHistoryFormProps) {
  const router = useRouter();
  const [state, setState] = useState<DentalState>({
    frequency_of_dental_visit: initialData?.frequency_of_dental_visit ?? "",
    date_of_last_dental_visit: initialData?.date_of_last_dental_visit ?? "",
    procedures_done_on_last_visit: initialData?.procedures_done_on_last_visit ?? "",
    exposure_to_local_anesthesia: initialData?.exposure_to_local_anesthesia ?? "",
    complications_during_after_procedure: initialData?.complications_during_after_procedure ?? "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);

  const setField = (field: keyof DentalState, value: string | boolean) => {
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

    const response = await fetch(`/api/patients/${patientId}/dental`, {
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
      setError(payload?.error ?? "Unable to save dental history.");
      return;
    }

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setSuccess("Dental history saved.");
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
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">History Intake</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#181e1a]">Dental History</h2>
            <p className="mt-1 text-sm text-[#4f564f]">Capture prior visits, anesthesia response, and procedure complications.</p>
          </section>
        )}

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Visit Pattern</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Frequency of dental visit</label>
              <input
                className={inputClass}
                value={state.frequency_of_dental_visit}
                onChange={(event) => setField("frequency_of_dental_visit", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Date of last dental visit</label>
              <input
                type="date"
                className={inputClass}
                value={state.date_of_last_dental_visit}
                onChange={(event) => setField("date_of_last_dental_visit", event.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Previous Procedures</p>
          <label className="mb-1 block text-sm font-medium">Procedure/s done on last dental visit</label>
          <textarea
            rows={5}
            className={inputClass}
            value={state.procedures_done_on_last_visit}
            onChange={(event) => setField("procedures_done_on_last_visit", event.target.value)}
          />
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Anesthesia Response</p>
          <label className="mb-1 block text-sm font-medium">Exposure and response to local anesthesia</label>
          <textarea
            rows={5}
            className={inputClass}
            value={state.exposure_to_local_anesthesia}
            onChange={(event) => setField("exposure_to_local_anesthesia", event.target.value)}
          />
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Complications</p>
          <label className="mb-1 block text-sm font-medium">Complications during and/or after dental procedure</label>
          <textarea
            rows={5}
            className={inputClass}
            value={state.complications_during_after_procedure}
            onChange={(event) => setField("complications_during_after_procedure", event.target.value)}
          />
        </fieldset>
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
                {isPending ? "Saving..." : "Save Dental History"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </form>
  );
}
