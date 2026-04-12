"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { IntraoralExamination } from "@/lib/types";

type IntraoralFormProps = {
  patientId: string;
  initialData: IntraoralExamination | null;
  formId?: string;
  hideIntroCard?: boolean;
  isEditable?: boolean;
  showSubmitButton?: boolean;
  onSavedHref?: string;
};

type IntraoralState = {
  soft_tissues: string;
  periodontium: string;
  occlusion: string;
  oral_hygiene_status: string;
  tooth_chart: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] sm:p-6";

export default function IntraoralForm({
  patientId,
  initialData,
  formId,
  hideIntroCard = false,
  isEditable = true,
  showSubmitButton = true,
  onSavedHref,
}: IntraoralFormProps) {
  const router = useRouter();
  const [state, setState] = useState<IntraoralState>({
    soft_tissues: initialData?.soft_tissues ?? "",
    periodontium: initialData?.periodontium ?? "",
    occlusion: initialData?.occlusion ?? "",
    oral_hygiene_status: initialData?.oral_hygiene_status ?? "",
    tooth_chart: initialData?.tooth_chart ?? "",
    notes: initialData?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);

  const setField = (field: keyof IntraoralState, value: string) => {
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

    const response = await fetch(`/api/patients/${patientId}/intraoral`, {
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
      setError(payload?.error ?? "Unable to save intraoral exam.");
      return;
    }

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setSuccess("Intraoral examination saved.");
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
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Exam Intake</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#181e1a]">Intraoral Examination</h2>
            <p className="mt-1 text-sm text-[#4f564f]">Document oral tissue findings, occlusion, hygiene status, and chart annotations.</p>
          </section>
        )}

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Tissue Health</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Soft tissues</label>
              <textarea
                rows={3}
                className={inputClass}
                value={state.soft_tissues}
                onChange={(event) => setField("soft_tissues", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Periodontium</label>
              <textarea
                rows={3}
                className={inputClass}
                value={state.periodontium}
                onChange={(event) => setField("periodontium", event.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-3`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Function</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Occlusion</label>
              <textarea
                rows={3}
                className={inputClass}
                value={state.occlusion}
                onChange={(event) => setField("occlusion", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Oral hygiene status</label>
              <textarea
                rows={3}
                className={inputClass}
                value={state.oral_hygiene_status}
                onChange={(event) => setField("oral_hygiene_status", event.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-4`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Tooth Chart</p>
          <label className="mb-1 block text-sm font-medium">Tooth chart notes</label>
          <textarea
            rows={6}
            className={inputClass}
            value={state.tooth_chart}
            onChange={(event) => setField("tooth_chart", event.target.value)}
            placeholder="Optional: notation for tooth chart findings"
          />
        </fieldset>
      </section>

      <section className={`${cardClass} lg:col-span-2`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Notes</p>
          <label className="mb-1 block text-sm font-medium">Additional notes</label>
          <textarea
            rows={6}
            className={inputClass}
            value={state.notes}
            onChange={(event) => setField("notes", event.target.value)}
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
                {isPending ? "Saving..." : "Save Intraoral Exam"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </form>
  );
}
