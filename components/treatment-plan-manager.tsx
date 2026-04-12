"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TreatmentPlan } from "@/lib/types";

type TreatmentPlanManagerProps = {
  patientId: string;
  initialPlans: TreatmentPlan[];
  formId?: string;
  hideIntroCard?: boolean;
  isEditable?: boolean;
  showSubmitButton?: boolean;
  onSavedHref?: string;
};

type PlanState = {
  plan_text: string;
  clinician_name: string;
  clinician_date: string;
  supervisor_name: string;
  supervisor_date: string;
};

const inputClass =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const cardClass =
  "rounded-[24px] border border-[#c4c7c3]/35 bg-white/85 p-5 shadow-[0_20px_44px_-30px_rgba(26,28,25,0.45)] sm:p-6";

const panelClass = "rounded-xl border border-[#c4c7c3]/45 bg-[#fafaf5] p-4";

export default function TreatmentPlanManager({
  patientId,
  initialPlans,
  formId,
  hideIntroCard = false,
  isEditable = true,
  showSubmitButton = true,
  onSavedHref,
}: TreatmentPlanManagerProps) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [state, setState] = useState<PlanState>({
    plan_text: "",
    clinician_name: "",
    clinician_date: "",
    supervisor_name: "",
    supervisor_date: "",
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

    if (!state.plan_text.trim()) {
      setError("Plan text is required.");
      return;
    }

    setIsPending(true);

    const response = await fetch(`/api/patients/${patientId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_text: state.plan_text,
        clinician_name: state.clinician_name || null,
        clinician_date: state.clinician_date || null,
        supervisor_name: state.supervisor_name || null,
        supervisor_date: state.supervisor_date || null,
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to add treatment plan.");
      return;
    }

    const payload = (await response.json()) as { plan: TreatmentPlan };
    setPlans((prev) => [payload.plan, ...prev]);
    setState({ plan_text: "", clinician_name: "", clinician_date: "", supervisor_name: "", supervisor_date: "" });

    if (onSavedHref) {
      router.replace(onSavedHref);
      router.refresh();
      return;
    }

    setMessage("Treatment plan added.");
  };

  return (
    <section className="patient-grid-morph grid gap-4 lg:grid-cols-12">
      {hideIntroCard ? null : (
        <article className={`${cardClass} lg:col-span-12`}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d655d]">Treatment Strategy</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#181e1a]">Treatment Plan</h2>
          <p className="mt-1 text-sm text-[#4f564f]">Draft treatment strategy and capture clinician and supervisor sign-off.</p>
        </article>
      )}

      <form id={formId} onSubmit={handleCreate} className={`${cardClass} lg:col-span-7`}>
        <fieldset disabled={!isEditable || isPending} className="contents">
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">New Plan</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Treatment plan</label>
            <textarea
              required
              rows={6}
              value={state.plan_text}
              onChange={(event) => setState((prev) => ({ ...prev, plan_text: event.target.value }))}
              placeholder="Outline treatment sequence, priorities, and considerations"
              className={inputClass}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Clinician name</label>
              <input
                value={state.clinician_name}
                onChange={(event) => setState((prev) => ({ ...prev, clinician_name: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Clinician date</label>
              <input
                type="date"
                value={state.clinician_date}
                onChange={(event) => setState((prev) => ({ ...prev, clinician_date: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Supervisor name</label>
              <input
                value={state.supervisor_name}
                onChange={(event) => setState((prev) => ({ ...prev, supervisor_name: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Supervisor date</label>
              <input
                type="date"
                value={state.supervisor_date}
                onChange={(event) => setState((prev) => ({ ...prev, supervisor_date: event.target.value }))}
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
              {isPending ? "Adding..." : "Add Plan"}
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Total plans</p>
            <p className="mt-1 text-2xl font-semibold text-[#1a1c19]">{plans.length}</p>
          </div>

          <div className={panelClass}>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Most recent clinician</p>
            <p className="mt-1 font-medium text-[#1a1c19]">{plans[0]?.clinician_name ?? "Not signed yet"}</p>
            <p className="text-xs text-[#5a6159]">{plans[0]?.clinician_date ?? "No date recorded"}</p>
          </div>
        </div>
      </aside>

      <article className={`${cardClass} lg:col-span-12`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Plan Archive</p>
          <p className="text-xs text-[#5a6159]">{plans.length === 1 ? "1 entry" : `${plans.length} entries`}</p>
        </div>

        {plans.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#c4c7c3]/45 px-3 py-5 text-center text-[color:var(--muted)]">
            No treatment plans yet.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-[#c4c7c3]/45 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm text-[#1a1c19]">{plan.plan_text}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Clinician</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{plan.clinician_name ?? "-"}</p>
                    <p className="text-xs text-[#5a6159]">{plan.clinician_date ?? "No date"}</p>
                  </div>

                  <div className={panelClass}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6159]">Supervisor</p>
                    <p className="mt-1 font-medium text-[#1a1c19]">{plan.supervisor_name ?? "-"}</p>
                    <p className="text-xs text-[#5a6159]">{plan.supervisor_date ?? "No date"}</p>
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
