import Link from "next/link";
import { ArrowLeft, FilePenLine, Phone, Save, Stethoscope, UserRound } from "lucide-react";
import DeletePatientButton from "@/components/delete-patient-button";
import { getPatientReviewStatusMeta } from "@/lib/patient-review-status";
import type { Patient } from "../lib/types";

type PatientPageHeaderProps = {
  patient: Patient;
  title: string;
  description: string;
  isEditing?: boolean;
  editHref?: string;
  cancelHref?: string;
  saveFormId?: string;
  editLabel?: string;
  saveLabel?: string;
  showDeleteButton?: boolean;
};

const toDisplayName = (patient: Patient): string => {
  return [patient.first_name, patient.middle_name ?? "", patient.last_name]
    .filter((part) => part.trim().length > 0)
    .join(" ");
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
    return "Not recorded";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not recorded";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default function PatientPageHeader({
  patient,
  title,
  description,
  isEditing = false,
  editHref,
  cancelHref,
  saveFormId,
  editLabel = "Edit Patient",
  saveLabel = "Save Changes",
  showDeleteButton = false,
}: PatientPageHeaderProps) {
  const contact = patient.cellphone ?? patient.home_telephone ?? "No contact info";
  const resolvedEditHref = editHref ?? `/patients/${patient.id}?edit=1`;
  const resolvedCancelHref = cancelHref ?? `/patients/${patient.id}`;
  const showSaveControls = isEditing && Boolean(saveFormId);
  const patientName = toDisplayName(patient);
  const reviewStatusMeta = getPatientReviewStatusMeta(patient.review_status);

  return (
    <header className="patient-header-morph relative mb-6 overflow-hidden rounded-[30px] border border-[#c4c7c3]/35 bg-[#fbfbf7] p-6 shadow-[0_26px_58px_-34px_rgba(26,28,25,0.5)] sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[-35%] h-[65%] w-[45%] rounded-full bg-[#e3e8dc]/30 blur-[100px]" />
        <div className="absolute bottom-[-45%] left-[-10%] h-[70%] w-[48%] rounded-full bg-[#c9d2c4]/25 blur-[110px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 rounded-full border border-[#c4c7c3]/50 bg-[#f4f4ef] px-3.5 py-2 text-xs text-[#404740] no-underline transition-colors hover:bg-[#ecece4] focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
              Back to Patient Records
            </Link>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#616861]">Patient Record</p>
              <h1 className="font-heading mt-2 text-3xl font-light leading-tight text-[#181e1a] sm:text-5xl">
                {toDisplayName(patient)}
              </h1>
              <p className="mt-2 text-base font-medium text-[#3f463f]">{patient.id}</p>
            </div>

            <p className="text-base leading-relaxed text-[#505850]">{description}</p>
          </div>

          {showSaveControls ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Link
                href={resolvedCancelHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#c4c7c3]/50 bg-[#f4f4ef] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-[#2d332f] no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ecece4] focus:outline-none"
              >
                Cancel
              </Link>

              <button
                type="submit"
                form={saveFormId}
                className="inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844]"
              >
                <Save className="h-4 w-4" strokeWidth={1.8} />
                {saveLabel}
              </button>

              {showDeleteButton ? (
                <DeletePatientButton patientId={patient.id} patientName={patientName} />
              ) : null}
            </div>
          ) : isEditing ? (
            <Link
              href={resolvedCancelHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844] focus:outline-none"
            >
              <FilePenLine className="h-4 w-4" strokeWidth={1.8} />
              Close Edit
            </Link>
          ) : (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Link
                href={resolvedEditHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844] focus:outline-none"
              >
                <FilePenLine className="h-4 w-4" strokeWidth={1.8} />
                {editLabel}
              </Link>

              {showDeleteButton ? (
                <DeletePatientButton patientId={patient.id} patientName={patientName} />
              ) : null}
            </div>
          )}
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-[#c4c7c3]/35 bg-white/80 px-4 py-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5d655d]">
              <Stethoscope className="h-3.5 w-3.5" />
              Current Section
            </p>
            <p className="mt-2 text-base font-semibold text-[#1a201a]">{title}</p>
          </article>

          <article className="rounded-2xl border border-[#c4c7c3]/35 bg-white/80 px-4 py-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5d655d]">
              <UserRound className="h-3.5 w-3.5" />
              Demographics
            </p>
            <p className="mt-2 text-sm text-[#2f372f]">
              {toSexLabel(patient.sex)}
              {patient.age !== null ? ` | ${patient.age} yrs` : ""}
            </p>
          </article>

          <article className="rounded-2xl border border-[#c4c7c3]/35 bg-white/80 px-4 py-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5d655d]">
              <Phone className="h-3.5 w-3.5" />
              Contact
            </p>
            <p className="mt-2 text-sm text-[#2f372f]">{contact}</p>
          </article>

          <article className="rounded-2xl border border-[#c4c7c3]/35 bg-white/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#5d655d]">Last Updated</p>
            <p className="mt-2 text-sm text-[#2f372f]">{toDateLabel(patient.updated_at)}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${reviewStatusMeta.className}`}>
              {reviewStatusMeta.label}
            </span>
          </article>
        </section>
      </div>
    </header>
  );
}
