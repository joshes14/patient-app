"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TreatmentRecord } from "@/lib/types";

type TreatmentRecordManagerProps = {
  patientId: string;
  initialRecords: TreatmentRecord[];
  formId?: string;
  hideIntroCard?: boolean;
  isEditable?: boolean;
  showSubmitButton?: boolean;
  onSavedHref?: string;
};

type RecordState = {
  treatment_date: string;
  tooth_number: string;
  procedure: string;
  clinician: string;
  clinical_supervisor: string;
};

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] sm:p-6";

const panelClass = "rounded-xl border border-[#c4c7c3]/45 bg-[#fafaf5] p-4";

export default function TreatmentRecordManager({
  patientId,
  initialRecords,
  formId,
  hideIntroCard = false,
  isEditable = true,
  showSubmitButton = true,
  onSavedHref,
}: TreatmentRecordManagerProps) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [state, setState] = useState<RecordState>({
    treatment_date: new Date().toISOString().slice(0, 10),
    tooth_number: "",
    procedure: "",
    clinician: "",
    clinical_supervisor: "",
  });
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEditable || isPending) {
      return;
    }

    setError("");
    setMessage("");

    if (!state.treatment_date || !state.procedure.trim()) {
      setError("Treatment date and procedure are required.");
      return;
    }

    setIsPending(true);

    const response = await fetch(`/api/patients/${patientId}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        treatment_date: state.treatment_date,
        tooth_number: state.tooth_number || null,
        procedure: state.procedure,
        clinician: state.clinician || null,
        clinical_supervisor: state.clinical_supervisor || null,
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error ?? "Unable to add treatment record.");
      return;
    }

    const payload = (await response.json()) as { record: TreatmentRecord };
    setRecords((prev) => [payload.record, ...prev]);
    setState({
      treatment_date: new Date().toISOString().slice(0, 10),
      tooth_number: "",
      procedure: "",
      clinician: "",
      clinical_supervisor: "",
    });

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setMessage("Treatment record added.");
  };

  return (
    <section className="patient-grid-morph grid gap-4 lg:grid-cols-12">
      {hideIntroCard ? null : (
        <article className={`${cardClass} lg:col-span-12`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Procedure Log</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#181e1a]">Treatment Records</h2>
          <p className="mt-1 text-sm text-[#4f564f]">Log completed procedures with date, tooth reference, and responsible clinicians.</p>
        </article>
      )}

      <form id={formId} onSubmit={handleCreate} className={`${cardClass} lg:col-span-7`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">New Record</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Treatment date</label>
              <input
                type="date"
                required
                value={state.treatment_date}
                onChange={(event) => setState((prev) => ({ ...prev, treatment_date: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tooth number</label>
              <input
                value={state.tooth_number}
                onChange={(event) => setState((prev) => ({ ...prev, tooth_number: event.target.value }))}
                placeholder="e.g. 14"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1 block text-sm font-medium">Procedure</label>
              <input
                required
                value={state.procedure}
                onChange={(event) => setState((prev) => ({ ...prev, procedure: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Clinician</label>
              <input
                value={state.clinician}
                onChange={(event) => setState((prev) => ({ ...prev, clinician: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Clinical supervisor</label>
              <input
                value={state.clinical_supervisor}
                onChange={(event) => setState((prev) => ({ ...prev, clinical_supervisor: event.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {showSubmitButton ? (
            <button
              type="submit"
              disabled={!isEditable || isPending}
              className="mt-4 rounded-full bg-[#2d332f] px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#424844] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Adding..." : "Add Treatment Record"}
            </button>
          ) : null}
        </fieldset>

        {error ? <p className="mt-3 text-sm text-[#ba1a1a]">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-[#444844]">{message}</p> : null}
      </form>

      <aside className={`${cardClass} lg:col-span-5`}>
        <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Snapshot</p>

        <div className="space-y-3">
          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Total records</p>
            <p className="mt-1 text-2xl font-semibold text-[#1a1c19]">{records.length}</p>
          </div>

          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Latest procedure</p>
            <p className="mt-1 font-medium text-[#1a1c19]">{records[0]?.procedure ?? "No entries yet"}</p>
            <p className="text-xs text-[#5a6159]">{records[0]?.treatment_date ?? "No date recorded"}</p>
          </div>
        </div>
      </aside>

      <article className={`${cardClass} lg:col-span-12`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Record Archive</p>
          <p className="text-xs text-[#5a6159]">{records.length === 1 ? "1 entry" : `${records.length} entries`}</p>
        </div>

        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#c4c7c3]/45 px-3 py-5 text-center text-[color:var(--muted)]">
            No treatment records yet.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {records.map((record) => (
              <article key={record.id} className="rounded-2xl border border-[#c4c7c3]/45 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Date</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{record.treatment_date}</p>
                  </div>

                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Tooth</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{record.tooth_number ?? "-"}</p>
                  </div>
                </div>

                <div className={`mt-3 ${panelClass}`}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Procedure</p>
                  <p className="mt-1 text-sm font-medium text-[#1a1c19]">{record.procedure}</p>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Clinician</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{record.clinician ?? "-"}</p>
                  </div>

                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Clinical supervisor</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{record.clinical_supervisor ?? "-"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
